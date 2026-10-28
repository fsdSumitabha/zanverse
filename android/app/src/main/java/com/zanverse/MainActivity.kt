package com.zanverse

import android.app.Notification
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "zanverse"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    routeNotificationPreferences(intent)
    super.onCreate(savedInstanceState)
  }

  override fun onNewIntent(intent: Intent) {
    routeNotificationPreferences(intent)
    super.onNewIntent(intent)
  }

  /**
   * Android Settings opens the app from "Additional settings in the app" with the
   * NOTIFICATION_PREFERENCES category and no link. React Native routes links only, so this gives the
   * intent the app's link to the Notification settings screen (src/navigation/linking.ts).
   */
  private fun routeNotificationPreferences(intent: Intent?) {
    if (intent == null || intent.data != null) return
    if (!intent.hasCategory(Notification.INTENT_CATEGORY_NOTIFICATION_PREFERENCES)) return
    intent.action = Intent.ACTION_VIEW
    intent.data = Uri.parse(NOTIFICATION_SETTINGS_LINK)
  }

  private companion object {
    const val NOTIFICATION_SETTINGS_LINK = "zanverse://settings/notifications"
  }
}
