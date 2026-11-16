import { Alert, PermissionsAndroid, Platform } from "react-native"
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from "react-native-notify-kit"

import {
    isPushPermissionBlocked,
    markExactAlarmAsked,
    markPushPermissionAsked,
    markPushPermissionBlocked,
    wasExactAlarmAsked,
    wasPushPermissionAsked,
} from "@/store/mmkv"

/**
 * Whether this phone shows the app's notifications. `can-ask` means the system dialog will still appear; `blocked`
 * means only system Settings can turn them on (Android said "never ask again", or Android 12 and older, where there is
 * no dialog).
 */
export type NotificationPermission = "granted" | "can-ask" | "blocked"

// Android 13 (API 33) added the POST_NOTIFICATIONS dialog. Before it, notifications are on unless turned off in Settings.
const FIRST_RUNTIME_PERMISSION_SDK = 33

function isAllowed(status: AuthorizationStatus): boolean {
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL
}

function hasPermissionDialog(): boolean {
    return Platform.OS === "android" && Number(Platform.Version) >= FIRST_RUNTIME_PERMISSION_SDK
}

// Shows the system dialog. On Android it goes through PermissionsAndroid, the only call that reports "never ask again".
async function askPermission(): Promise<boolean> {
    markPushPermissionAsked()
    if (hasPermissionDialog()) {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) markPushPermissionBlocked()
        return result === PermissionsAndroid.RESULTS.GRANTED
    }
    const settings = await notifee.requestPermission()
    return isAllowed(settings.authorizationStatus)
}

/** Reads whether notifications show, and if not, whether the app may still ask. */
export async function getNotificationPermission(): Promise<NotificationPermission> {
    const settings = await notifee.getNotificationSettings()
    if (isAllowed(settings.authorizationStatus)) return "granted"
    if (Platform.OS === "android") return hasPermissionDialog() && !isPushPermissionBlocked() ? "can-ask" : "blocked"
    return settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED ? "can-ask" : "blocked"
}

/**
 * The "Turn on notifications" button: shows the system dialog while Android still will, and opens the app's page in
 * system Settings once it will not. Resolves to the state afterwards.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    const state = await getNotificationPermission()
    if (state === "granted") return state
    if (state === "blocked") {
        await notifee.openNotificationSettings()
        return state
    }
    return (await askPermission()) ? "granted" : getNotificationPermission()
}

/**
 * Asks for the notification permission the first time a callback is saved, never at launch, and only once ever. A
 * "no" leaves everything else working: the reminder is still scheduled, Android just does not show it. Resolves to
 * whether notifications may show.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
    try {
        if (wasPushPermissionAsked()) return (await getNotificationPermission()) === "granted"
        return await askPermission()
    } catch (error) {
        console.warn("Push: could not read the notification permission", error)
        return false
    }
}

/**
 * Whether callback reminders can ring at the exact minute. Android 14 and later deny exact alarms to a new install
 * until the person allows "Alarms & reminders"; without it a reminder can ring a few minutes late.
 */
export async function hasExactAlarms(): Promise<boolean> {
    const settings = await notifee.getNotificationSettings()
    return settings.android?.alarm !== AndroidNotificationSetting.DISABLED
}

/** Opens Android's "Alarms & reminders" page for the app. */
export function openExactAlarmSettings(): Promise<void> {
    return notifee.openAlarmPermissionSettings()
}

/**
 * Asks once ever, after the first callback is saved, to allow exact alarms. Android 14 and later deny them to a new
 * install, and few people would find the row in Notification settings. "Not now" leaves that row as the way back.
 */
export async function askExactAlarmsOnce(): Promise<void> {
    if (Platform.OS !== "android" || wasExactAlarmAsked() || (await hasExactAlarms())) return
    markExactAlarmAsked()
    Alert.alert(
        "Ring callbacks on time?",
        "Android can ring a callback reminder a few minutes late. To ring it at the exact minute, allow Alarms & reminders for this app.",
        [
            { text: "Not now", style: "cancel" },
            { text: "Open settings", onPress: () => openExactAlarmSettings() },
        ],
    )
}

/** True while Android's battery saver may stop the app in the background, which can hold pushes back. */
export function isBatteryRestricted(): Promise<boolean> {
    return notifee.isBatteryOptimizationEnabled()
}

/** Opens Android's battery page, where the person can choose "Unrestricted" for the app. */
export function openBatterySettings(): Promise<void> {
    return notifee.openBatteryOptimizationSettings()
}

/** Opens system Settings for the app's notifications, or for one channel. */
export function openChannelSettings(channelId?: string): Promise<void> {
    return notifee.openNotificationSettings(channelId)
}
