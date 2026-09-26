package expo.modules.powersensor

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Waits for the charger to lose or regain power and reports it for the phone's Home square.
 * A plug that is pulled and pushed back within 20 seconds is ignored (wobbly cable, not a power cut).
 * "Back" is only sent after this phone has reported "out", so plugging in at random times adds no noise.
 * Reports are queued and retried for a few minutes, because the Wi-Fi router usually dies with the power.
 */
class PowerWatchService : Service() {
  companion object {
    const val PREFS = "alo_power_sensor"
    private const val CHANNEL = "alo_sensor"
    private const val NOTIF_ID = 4711
    private const val DEBOUNCE_MS = 20_000L
    private const val MAX_AGE_MS = 9 * 60_000L
    private val lock = Any()
    @Volatile private var sending = false

    fun start(ctx: Context) {
      val i = Intent(ctx, PowerWatchService::class.java)
      if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i) else ctx.startService(i)
    }

    fun enqueue(ctx: Context, status: String, atMs: Long) {
      val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      synchronized(lock) {
        if (status == "back") {
          val lastOut = p.getLong("lastOut", 0L)
          if (lastOut == 0L || atMs - lastOut > 12 * 3600_000L) return
          p.edit().putLong("lastOut", 0L).apply()
        } else {
          p.edit().putLong("lastOut", atMs).apply()
        }
        val q = JSONArray(p.getString("queue", "[]"))
        q.put(JSONObject().put("status", status).put("at", atMs))
        val keep = JSONArray()
        for (i in maxOf(0, q.length() - 20) until q.length()) keep.put(q.get(i))
        p.edit().putString("queue", keep.toString()).apply()
      }
      flush(ctx)
    }

    fun flush(ctx: Context) {
      if (sending) return
      sending = true
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      val wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "alo:sensor-send")
      wl.acquire(7 * 60_000L)
      Thread {
        try {
          for (attempt in 0 until 24) { // about 6 minutes
            if (sendAll(ctx)) break
            Thread.sleep(15_000L)
          }
        } catch (e: Exception) {
        } finally {
          sending = false
          try { if (wl.isHeld) wl.release() } catch (e: Exception) {}
        }
      }.start()
    }

    /** true = queue empty (or nothing sendable); false = network trouble, try again later. */
    private fun sendAll(ctx: Context): Boolean {
      val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val url = p.getString("url", null)
      val key = p.getString("key", null)
      val gi = p.getInt("gi", 0)
      val gj = p.getInt("gj", 0)
      val q = synchronized(lock) { JSONArray(p.getString("queue", "[]")) }
      if (q.length() == 0) return true
      if (url == null || key == null || gi == 0 || gj == 0) {
        synchronized(lock) { p.edit().putString("queue", "[]").apply() }
        return true
      }
      val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
      iso.timeZone = TimeZone.getTimeZone("UTC")
      var done = 0
      var ok = true
      for (i in 0 until q.length()) {
        val e = q.getJSONObject(i)
        val at = e.getLong("at")
        if (System.currentTimeMillis() - at <= MAX_AGE_MS) {
          val body = JSONObject()
            .put("area_id", p.getString("area", "unknown"))
            .put("status", e.getString("status"))
            .put("device_id", p.getString("device", ""))
            .put("source", "sensor")
            .put("gi", gi)
            .put("gj", gj)
            .put("occurred_at", iso.format(Date(at)))
          val code = post("$url/rest/v1/reports", key, body.toString())
          if (code < 0 || code >= 500) { ok = false; break } // offline or server trouble: keep it for later
        }
        done++ // sent, refused (4xx, e.g. rate limit) or too old: drop it
      }
      synchronized(lock) {
        val now = JSONArray(p.getString("queue", "[]"))
        val rest = JSONArray()
        for (i in minOf(done, now.length()) until now.length()) rest.put(now.get(i))
        p.edit().putString("queue", rest.toString()).apply()
        return ok && rest.length() == 0
      }
    }

    private fun post(u: String, key: String, json: String): Int {
      return try {
        val c = URL(u).openConnection() as HttpURLConnection
        c.requestMethod = "POST"
        c.connectTimeout = 10_000
        c.readTimeout = 10_000
        c.doOutput = true
        c.setRequestProperty("apikey", key)
        c.setRequestProperty("Authorization", "Bearer $key")
        c.setRequestProperty("Content-Type", "application/json")
        c.setRequestProperty("Prefer", "return=minimal")
        c.outputStream.use { it.write(json.toByteArray(Charsets.UTF_8)) }
        val code = c.responseCode
        c.disconnect()
        code
      } catch (e: Exception) {
        -1
      }
    }
  }

  private val handler = Handler(Looper.getMainLooper())
  private var pendingOut: Runnable? = null
  private var registered = false

  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(c: Context, intent: Intent) {
      val now = System.currentTimeMillis()
      val app = applicationContext
      when (intent.action) {
        Intent.ACTION_POWER_DISCONNECTED -> {
          pendingOut?.let { handler.removeCallbacks(it) }
          val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
          val wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "alo:sensor-wait")
          wl.acquire(DEBOUNCE_MS + 10_000L)
          val r = Runnable {
            pendingOut = null
            enqueue(app, "out", now)
            try { if (wl.isHeld) wl.release() } catch (e: Exception) {}
          }
          pendingOut = r
          handler.postDelayed(r, DEBOUNCE_MS)
        }
        Intent.ACTION_POWER_CONNECTED -> {
          val r = pendingOut
          if (r != null) {
            handler.removeCallbacks(r) // unplugged and plugged back quickly: not a power cut
            pendingOut = null
          } else {
            enqueue(app, "back", now)
          }
        }
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    try {
      startForeground()
    } catch (e: Exception) {
      stopSelf()
      return
    }
    val f = IntentFilter()
    f.addAction(Intent.ACTION_POWER_CONNECTED)
    f.addAction(Intent.ACTION_POWER_DISCONNECTED)
    if (Build.VERSION.SDK_INT >= 33) registerReceiver(receiver, f, Context.RECEIVER_NOT_EXPORTED)
    else registerReceiver(receiver, f)
    registered = true
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    flush(applicationContext)
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    if (registered) {
      try { unregisterReceiver(receiver) } catch (e: Exception) {}
      registered = false
    }
    super.onDestroy()
  }

  @Suppress("DEPRECATION")
  private fun startForeground() {
    val bn = getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("lang", "bn") == "bn"
    val title = if (bn) "আলো বিদ্যুৎ যাওয়া খেয়াল রাখছে" else "Alo is watching for power cuts"
    val text = if (bn) "চার্জে থাকা অবস্থায় বিদ্যুৎ গেলে প্রতিবেশীদের জানাবে" else "Tells your neighbours when the power goes while this phone is charging"
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) {
      val ch = NotificationChannel(CHANNEL, if (bn) "বিদ্যুৎ সেন্সর" else "Power-cut sensor", NotificationManager.IMPORTANCE_MIN)
      ch.setShowBadge(false)
      nm.createNotificationChannel(ch)
    }
    val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL) else Notification.Builder(this)
    b.setSmallIcon(android.R.drawable.ic_lock_idle_charging)
      .setContentTitle(title)
      .setContentText(text)
      .setOngoing(true)
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    if (launch != null) {
      b.setContentIntent(PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT))
    }
    val n = b.build()
    if (Build.VERSION.SDK_INT >= 34) startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    else startForeground(NOTIF_ID, n)
  }
}
