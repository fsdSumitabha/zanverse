import notifee, { AuthorizationStatus } from "@notifee/react-native"

import { markPushPermissionAsked, wasPushPermissionAsked } from "@/store/mmkv"

function isAllowed(status: AuthorizationStatus): boolean {
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL
}

/**
 * Asks for the notification permission the first time a callback is saved, never at launch, and only once ever. A
 * "no" leaves everything else working: the reminder is still scheduled, Android just does not show it. Resolves to
 * whether notifications may show.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
    try {
        if (wasPushPermissionAsked()) {
            const settings = await notifee.getNotificationSettings()
            return isAllowed(settings.authorizationStatus)
        }
        markPushPermissionAsked()
        const settings = await notifee.requestPermission()
        return isAllowed(settings.authorizationStatus)
    } catch (error) {
        console.warn("Push: could not read the notification permission", error)
        return false
    }
}
