import notifee from "@notifee/react-native"
import type { RemoteMessage } from "@react-native-firebase/messaging"

import { CRM_CHANNEL_ID, ensureChannels } from "./channels"

const FALLBACK_TITLE = "ZAN Services"

function readText(value: unknown): string | undefined {
    return typeof value === "string" && value ? value : undefined
}

/**
 * Shows an FCM message through Notifee on the "CRM updates" channel. Android shows nothing for a message that arrives
 * while the app is open, or for a data-only message, so the app shows it. Its `data.url` routes the tap.
 */
export async function displayRemoteMessage(message: RemoteMessage): Promise<void> {
    await ensureChannels()
    await notifee.displayNotification({
        title: readText(message.notification?.title) ?? readText(message.data?.title) ?? FALLBACK_TITLE,
        body: readText(message.notification?.body) ?? readText(message.data?.body),
        data: message.data,
        android: { channelId: CRM_CHANNEL_ID, pressAction: { id: "default" } },
    })
}
