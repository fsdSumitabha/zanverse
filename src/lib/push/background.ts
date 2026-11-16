import notifee, { EventType } from "@notifee/react-native"
import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging"

import { openPushUrl } from "./openPushUrl"
import { displayRemoteMessage } from "./remoteMessage"
import { isFirebaseConfigured } from "./token"

/**
 * The handlers that must exist outside the React tree, registered from `index.js` before the app renders: a tap on a
 * reminder while the app is in the background or closed, and an FCM data message that arrives then.
 */
export function registerPushBackgroundHandlers(): void {
    // The app opens on a tap. If the screens are already there it navigates now; otherwise the url waits for them.
    notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) openPushUrl(detail.notification?.data?.url)
    })

    if (!isFirebaseConfigured()) return
    // Android shows a notification message itself. A data-only message has nothing on screen until Notifee shows it.
    setBackgroundMessageHandler(getMessaging(), async (message) => {
        if (!message.notification) await displayRemoteMessage(message)
    })
}
