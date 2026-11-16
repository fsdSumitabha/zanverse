import notifee, { EventType } from "@notifee/react-native"
import {
    getInitialNotification,
    getMessaging,
    onMessage,
    onNotificationOpenedApp,
} from "@react-native-firebase/messaging"
import { useEffect, useRef, type ReactNode } from "react"

import { useNotifications } from "@/contexts/NotificationContext"
import { ensureChannels } from "@/lib/push/channels"
import { openPendingPushUrl, openPushUrl } from "@/lib/push/openPushUrl"
import { displayRemoteMessage } from "@/lib/push/remoteMessage"
import { isFirebaseConfigured } from "@/lib/push/token"

// The notification that started the app is read once per launch, not again when a region switch remounts the tabs.
let wasLaunchChecked = false

/**
 * Notifications while the app is open, mounted beside NotificationProvider above the tabs. It creates the channels,
 * shows an FCM message on the "CRM updates" channel and refreshes the bell with it, and routes every tap (a reminder,
 * a shown push, a push opened from the tray, the one that launched the app) to its screen. The bell's 30 s poll stays.
 */
export function PushProvider({ children }: { children: ReactNode }) {
    const { refreshBadge } = useNotifications()
    const refreshRef = useRef(refreshBadge)
    refreshRef.current = refreshBadge

    useEffect(() => {
        ensureChannels()
        openPendingPushUrl()

        const stopForeground = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) openPushUrl(detail.notification?.data?.url)
        })
        const isFirstMount = !wasLaunchChecked
        wasLaunchChecked = true
        if (isFirstMount) {
            notifee.getInitialNotification().then((initial) => openPushUrl(initial?.notification.data?.url))
        }
        if (!isFirebaseConfigured()) return stopForeground

        const messaging = getMessaging()
        const stopMessage = onMessage(messaging, async (message) => {
            await displayRemoteMessage(message)
            refreshRef.current()
        })
        const stopOpened = onNotificationOpenedApp(messaging, (message) => openPushUrl(message.data?.url))
        if (isFirstMount) getInitialNotification(messaging).then((message) => openPushUrl(message?.data?.url))
        return () => {
            stopForeground()
            stopMessage()
            stopOpened()
        }
    }, [])

    return children
}
