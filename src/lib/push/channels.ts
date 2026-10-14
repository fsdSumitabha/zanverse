import notifee, { AndroidImportance } from "@notifee/react-native"

/** Due-callback reminders: high importance, with sound and vibration. */
export const CALLBACK_CHANNEL_ID = "callbacks"
/** Pushes from the CRM shown while the app is open. */
export const CRM_CHANNEL_ID = "crm"

/**
 * The Android look of every notification the app shows: the white ZAN mark in the status bar
 * (res/drawable/ic_notification.xml) on the brand navy. Without it Android draws the launcher icon as a white blob.
 * Firebase shows its own pushes with the same two values, from AndroidManifest.xml and res/values/colors.xml.
 */
export const NOTIFICATION_APPEARANCE = { smallIcon: "ic_notification", color: "#183668" } as const

let created: Promise<void> | null = null

/**
 * Creates the two Android notification channels, once per app start. Creating a channel again is harmless, but
 * every reminder waits on this, so it runs once and is shared. A failure is retried on the next call.
 */
export function ensureChannels(): Promise<void> {
    if (!created) {
        created = Promise.all([
            notifee.createChannel({
                id: CALLBACK_CHANNEL_ID,
                name: "Callback reminders",
                importance: AndroidImportance.HIGH,
                sound: "default",
                vibration: true,
            }),
            notifee.createChannel({ id: CRM_CHANNEL_ID, name: "CRM updates", importance: AndroidImportance.DEFAULT }),
        ]).then(
            () => undefined,
            (error: unknown) => {
                created = null
                console.warn("Push: could not create the notification channels", error)
            },
        )
    }
    return created
}
