/**
 * The notification feed as `GET /api/notifications` returns it. App-local: the web declares the same shape inside
 * its page and its bell, with no shared type to copy.
 */
export interface NotificationRow {
    _id: string
    type: number
    title: string
    body?: string
    /** A web path: `/admin/operations/{leads|clients|projects}/:id`, from the web's notifications/render.ts. */
    url?: string
    /** An icon name such as "calendar-x", or a legacy emoji. */
    badge?: string
    imageUrl?: string
    seenAt: string | null
    readAt: string | null
    createdAt: string
}

export interface NotificationFeed {
    success: boolean
    data?: NotificationRow[]
    /** Rows never shown in the bell or the inbox. */
    unseen?: number
    unread?: number
    total?: number
    /** The `before` cursor for the next older page, or null at the end. */
    nextCursor?: string | null
}
