package expo.modules.powersensor

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// Restarts the sensor after the phone reboots or the app updates, if the person had it switched on.
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(c: Context, i: Intent) {
    if (i.action != Intent.ACTION_BOOT_COMPLETED && i.action != Intent.ACTION_MY_PACKAGE_REPLACED) return
    val on = c.getSharedPreferences(PowerWatchService.PREFS, Context.MODE_PRIVATE).getBoolean("enabled", false)
    if (on) {
      try { PowerWatchService.start(c) } catch (e: Exception) {}
    }
  }
}
