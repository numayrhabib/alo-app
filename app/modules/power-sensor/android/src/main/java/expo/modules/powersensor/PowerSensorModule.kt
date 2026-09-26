package expo.modules.powersensor

import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class PowerSensorModule : Module() {
  private val ctx: Context
    get() = appContext.reactContext?.applicationContext ?: throw IllegalStateException("No Android context")

  private fun prefs() = ctx.getSharedPreferences(PowerWatchService.PREFS, Context.MODE_PRIVATE)

  override fun definition() = ModuleDefinition {
    Name("PowerSensor")

    // {url, key, device, gi, gj, area, lang}
    Function("configure") { json: String ->
      val o = JSONObject(json)
      prefs().edit()
        .putString("url", o.getString("url"))
        .putString("key", o.getString("key"))
        .putString("device", o.getString("device"))
        .putInt("gi", o.getInt("gi"))
        .putInt("gj", o.getInt("gj"))
        .putString("area", o.optString("area", "unknown"))
        .putString("lang", o.optString("lang", "bn"))
        .apply()
      true
    }

    Function("start") {
      prefs().edit().putBoolean("enabled", true).apply()
      PowerWatchService.start(ctx)
      true
    }

    Function("stop") {
      prefs().edit().putBoolean("enabled", false).apply()
      ctx.stopService(Intent(ctx, PowerWatchService::class.java))
      true
    }

    Function("isEnabled") {
      prefs().getBoolean("enabled", false)
    }
  }
}
