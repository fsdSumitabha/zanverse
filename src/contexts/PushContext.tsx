import {
    getInitialNotification,
    getMessaging,
    onMessage,
    onNotificationOpenedApp,
} from "@react-native-firebase/messaging"
import { useEffect, useRef, type ReactNode } from "react"
import { AppState } from "react-native"
import notifee from "react-native-notify-kit"

import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { ensureChannels } from "@/lib/push/channels"
import { isFirebaseConfigured } from "@/lib/push/device"
import { handleInitialNotification, handleNotificationEvent, runPendingCall, setPushAppReady } from "@/lib/push/events"
import { openPendingPushUrl, openPushUrl } from "@/lib/push/openPushUrl"
import { showForegroundPush } from "@/lib/push/remoteMessage"

// The notification that started the app is read once per launch, not again when a region switch remounts the tabs.
let wasLaunchChecked = false

/**
 * Notifications while the app is open, mounted beside NotificationProvider above the tabs. It creates the channels the
 * role can receive, turns a push that arrives on screen into a toast and a bell refresh, and routes every press (a
 * tap, Open, Call, Snooze, the one that launched the app) through one handler. The bell's poll stays as a backup.
 */
export function PushProvider({ children }: { children: ReactNode }) {
    const { role } = useAuth()
    const { refreshBadge } = useNotifications()
    const refreshRef = useRef(refreshBadge)
    refreshRef.current = refreshBadge

    useEffect(() => {
        ensureChannels(role)
    }, [role])

    useEffect(() => {
        openPendingPushUrl()
        setPushAppReady(true)

        const stopForeground = notifee.onForegroundEvent(handleNotificationEvent)
        // A Call pressed while the app was closed dials once the app is on screen.
        const appSubscription = AppState.addEventListener("change", (next) => {
            if (next === "active") runPendingCall()
        })
        const isFirstMount = !wasLaunchChecked
        wasLaunchChecked = true
        if (isFirstMount) notifee.getInitialNotification().then(handleInitialNotification)

        function stopApp() {
            setPushAppReady(false)
            stopForeground()
            appSubscription.remove()
        }
        if (!isFirebaseConfigured()) return stopApp

        const messaging = getMessaging()
        const stopMessage = onMessage(messaging, async (message) => {
            await showForegroundPush(message)
            refreshRef.current()
        })
        // Pushes Android showed itself (a notification message, such as a Firebase console test) open their url too.
        const stopOpened = onNotificationOpenedApp(messaging, (message) => openPushUrl(message.data?.url))
        if (isFirstMount) getInitialNotification(messaging).then((message) => openPushUrl(message?.data?.url))
        return () => {
            stopApp()
            stopMessage()
            stopOpened()
        }
    }, [])

    return children
}
