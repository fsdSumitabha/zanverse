import type { AndroidAction, NotificationPressAction } from "react-native-notify-kit"

/** What a person can press on a notification. OPEN is also a tap on the notification itself. */
export const PRESS_ACTION = {
    OPEN: "default",
    CALL: "call",
    SNOOZE: "snooze",
} as const

// Android 12 and later block opening the app from a receiver (a "trampoline"), so a press that needs the app on screen
// names the app's activity, and Android opens it directly.
const LAUNCH_APP = "default"

/** A tap on the notification: opens the app at the record. */
export const OPEN_PRESS: NotificationPressAction = { id: PRESS_ACTION.OPEN, launchActivity: LAUNCH_APP }

/** Opens the app at the record. */
export const OPEN_ACTION: AndroidAction = { title: "Open", pressAction: OPEN_PRESS }

/** Opens the app at the record, then starts the dialer. */
export const CALL_ACTION: AndroidAction = {
    title: "Call",
    pressAction: { id: PRESS_ACTION.CALL, launchActivity: LAUNCH_APP },
}

/** Moves a callback reminder 15 minutes later. The app stays closed. */
export const SNOOZE_ACTION: AndroidAction = { title: "Snooze 15 min", pressAction: { id: PRESS_ACTION.SNOOZE } }
