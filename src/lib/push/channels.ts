import notifee, {
    AndroidImportance,
    AndroidVisibility,
    type AndroidChannel,
    type NativeAndroidChannel,
} from "react-native-notify-kit"

import type { EventType } from "@/constants/eventTypes"
import { canUseLeadSources } from "@/constants/leadSourceRoles"
import { NOTIFICATION_RULES } from "@/constants/notificationRules"
import {
    PUSH_CHANNEL,
    PUSH_CHANNEL_BY_EVENT,
    PUSH_CHANNEL_GROUP_META,
    PUSH_CHANNEL_META,
    PUSH_LEVEL,
    type PushChannel,
    type PushLevel,
} from "@/constants/pushChannels"

/** Due-callback reminders. Reminders already scheduled on phones point at this id, so it never changes. */
export const CALLBACK_CHANNEL_ID = PUSH_CHANNEL_META[PUSH_CHANNEL.CALLBACKS].id

/**
 * The Android look of every notification the app shows: the white ZAN mark in the status bar
 * (res/drawable/ic_notification.xml) on the brand navy. Without it Android draws the launcher icon as a white blob.
 * Firebase shows its own pushes with the same two values, from AndroidManifest.xml and res/values/colors.xml.
 */
export const NOTIFICATION_APPEARANCE = { smallIcon: "ic_notification", color: "#183668" } as const

// The one channel every push used before the channel list. Deleting it moves nobody's settings: there is no match.
const RETIRED_CHANNEL_IDS = ["crm"]

const IMPORTANCE: Record<PushLevel, AndroidImportance> = {
    [PUSH_LEVEL.URGENT]: AndroidImportance.HIGH,
    [PUSH_LEVEL.DEFAULT]: AndroidImportance.DEFAULT,
    [PUSH_LEVEL.SILENT]: AndroidImportance.LOW,
}

/** How a channel behaves now, after anything the person changed in Settings. */
export type ChannelState = "off" | "pops-up" | "sound" | "silent"

export interface ChannelStatus {
    code: PushChannel
    state: ChannelState
}

// Created this app start, by channel code. A failure is forgotten, so the next call tries again.
const created = new Map<PushChannel, Promise<void>>()
let wasCleanedUp = false

/**
 * The channels a role can receive: General, Callback reminders for anyone who works lead sources, and the channel of
 * every event NOTIFICATION_RULES sends to the role. Sorted by code, which is the order of the list in Settings.
 */
export function getChannelsForRole(role: number | null): PushChannel[] {
    const channels = new Set<PushChannel>([PUSH_CHANNEL.GENERAL])
    if (role === null) return [...channels]
    if (canUseLeadSources(role)) channels.add(PUSH_CHANNEL.CALLBACKS)
    for (const [code, roles] of Object.entries(NOTIFICATION_RULES)) {
        if (!(roles as number[] | undefined)?.includes(role)) continue
        channels.add(PUSH_CHANNEL_BY_EVENT[Number(code) as EventType] ?? PUSH_CHANNEL.GENERAL)
    }
    return [...channels].sort((a, b) => a - b)
}

/** The channel code a push names in `data.channel`. Anything unknown, or a push from before channels, is General. */
export function resolveChannel(raw: unknown): PushChannel {
    const code = Number(raw)
    return code in PUSH_CHANNEL_META ? (code as PushChannel) : PUSH_CHANNEL.GENERAL
}

function toAndroidChannel(code: PushChannel): AndroidChannel {
    const meta = PUSH_CHANNEL_META[code]
    const isSilent = meta.level === PUSH_LEVEL.SILENT
    return {
        id: meta.id,
        name: meta.label,
        description: meta.description,
        importance: IMPORTANCE[meta.level],
        // The whole notification shows on the lock screen. The person can still hide it per channel in Settings.
        visibility: AndroidVisibility.PUBLIC,
        sound: isSilent ? undefined : "default",
        vibration: !isSilent,
        badge: true,
        ...(meta.group ? { groupId: PUSH_CHANNEL_GROUP_META[meta.group].id } : {}),
    }
}

/**
 * Creates one channel, once per app start. A push names its channel, and a role can still receive one it was not
 * given, such as a meeting update for an attendee, so every display waits on this first.
 *
 * Android sets a channel's importance, sound and lock-screen choice once, when it first creates it. Creating it again
 * only updates the name, the description, and a group it did not have yet.
 */
export function ensureChannel(code: PushChannel): Promise<void> {
    let pending = created.get(code)
    if (!pending) {
        const group = PUSH_CHANNEL_META[code].group
        pending = (async () => {
            if (group) {
                const { id, label } = PUSH_CHANNEL_GROUP_META[group]
                await notifee.createChannelGroup({ id, name: label })
            }
            await notifee.createChannel(toAndroidChannel(code))
        })().catch((error: unknown) => {
            created.delete(code)
            console.warn(`Push: could not create the ${PUSH_CHANNEL_META[code].id} channel`, error)
        })
        created.set(code, pending)
    }
    return pending
}

/**
 * Creates the channels the role can receive, so Settings lists them before the first push arrives, and deletes the
 * retired `crm` channel. Channels from an earlier user of this phone stay: deleting them would only count up Android's
 * "categories deleted" line, and the same user may sign in again.
 */
export async function ensureChannels(role: number | null): Promise<void> {
    if (!wasCleanedUp) {
        wasCleanedUp = true
        await Promise.all(RETIRED_CHANNEL_IDS.map((id) => notifee.deleteChannel(id))).catch(() => undefined)
    }
    await Promise.all(getChannelsForRole(role).map(ensureChannel))
}

function getChannelState(channel: NativeAndroidChannel, isGroupBlocked: boolean): ChannelState {
    const importance = channel.importance ?? AndroidImportance.DEFAULT
    if (channel.blocked || isGroupBlocked || importance === AndroidImportance.NONE) return "off"
    if (importance >= AndroidImportance.HIGH) return "pops-up"
    if (importance === AndroidImportance.DEFAULT) return "sound"
    return "silent"
}

/**
 * The app's channels on this phone, in code order, each with what it does now. The person owns these settings: a
 * channel they set to silent, or a whole group they turned off, reads that way here.
 */
export async function getChannelStatuses(): Promise<ChannelStatus[]> {
    const [channels, groups] = await Promise.all([notifee.getChannels(), notifee.getChannelGroups()])
    const byId = new Map(channels.map((channel) => [channel.id, channel]))
    const blockedGroups = new Set(groups.filter((group) => group.blocked).map((group) => group.id))
    const codes = Object.keys(PUSH_CHANNEL_META).map(Number) as PushChannel[]
    return codes.flatMap((code) => {
        const channel = byId.get(PUSH_CHANNEL_META[code].id)
        if (!channel) return []
        return [{ code, state: getChannelState(channel, blockedGroups.has(channel.groupId ?? "")) }]
    })
}
