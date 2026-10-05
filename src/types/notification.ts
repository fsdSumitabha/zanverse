// RN copy. The web types these ids as mongoose `Types.ObjectId`. Here they are `string`, so the file compiles
// without mongoose. Nothing else is changed.

import type { EventType } from "@/constants/eventTypes"
import { NotificationChannel } from "@/constants/notificationChannels"

export interface NotificationActor {
    id: string
    name?: string
    role?: number
}

export interface RenderedMessage {
    title: string
    body?: string
    url?: string
    badge: string
    imageUrl?: string
}

export interface EmitInput {
    type: EventType
    entityType: number
    entityId: string
    actor: NotificationActor | null
    payload: Record<string, unknown>
    meta?: Record<string, unknown>
    channels?: NotificationChannel[]
    extraRecipients?: string[]
}

export interface DispatchContext {
    type: EventType
    entityType: number
    entityId: string
    actor: NotificationActor | null
    actorOid: string | null
    recipients: string[]
    message: RenderedMessage
    channels: number[]
    meta?: Record<string, unknown>
}
