import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging"
import notifee from "react-native-notify-kit"

import { isFirebaseConfigured } from "./device"
import { handleNotificationEvent } from "./events"
import { displayRemoteMessage } from "./remoteMessage"

/**
 * The handlers that must exist outside the React tree, registered from `index.js` before the app renders: a press on a
 * notification while the app is in the background or closed, and an FCM data message that arrives then.
 */
export function registerPushBackgroundHandlers(): void {
    // A tap or a button. Open and Call bring the app up; a url waits for the screens, a call for the app on screen.
    notifee.onBackgroundEvent(handleNotificationEvent)

    if (!isFirebaseConfigured()) return
    // Android shows a notification message itself. A data-only message, which is every CRM push, shows nothing until
    // the app shows it on its channel.
    setBackgroundMessageHandler(getMessaging(), async (message) => {
        if (!message.notification) await displayRemoteMessage(message)
    })
}
