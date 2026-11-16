import notifee, { AndroidImportance } from "@notifee/react-native"

/** Due-callback reminders: high importance, with sound and vibration. */
export const CALLBACK_CHANNEL_ID = "callbacks"
/** Pushes from the CRM shown while the app is open. */
export const CRM_CHANNEL_ID = "crm"

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
