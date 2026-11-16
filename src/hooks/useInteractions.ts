import { useFocusEffect } from "@react-navigation/native"
import { useCallback, useEffect, useRef, useState } from "react"

import { ApiError, isAbortError, sendRaw } from "@/api/client"
import type { TimelineItem, TimelineResponse } from "@/components/interactions/timelineTypes"
import { ENTITY_TYPE } from "@/constants/entityTypes"

/** The entities with a timeline route, and its path segment. */
const TIMELINE_SEGMENTS: Partial<Record<number, string>> = {
    [ENTITY_TYPE.LEAD]: "leads",
    [ENTITY_TYPE.CLIENT]: "clients",
    [ENTITY_TYPE.PROJECT]: "projects",
}

interface Options {
    entityType: number
    entityId: string
}

/** The timeline route for a lead, client or project, or null for any other entity. */
export function getTimelinePath(entityType: number, entityId: string): string | null {
    const segment = TIMELINE_SEGMENTS[entityType]
    return segment ? `/api/admin/operations/${segment}/${entityId}/interactions` : null
}

/**
 * One record's timeline. The routes answer `{ success, interactions }` at the top level, so this reads it through
 * `sendRaw`. It reloads quietly when the screen is focused again, which is how a row added in a form modal appears.
 */
export function useInteractions({ entityType, entityId }: Options) {
    const [interactions, setInteractions] = useState<TimelineItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadCount, setReloadCount] = useState(0)
    const path = getTimelinePath(entityType, entityId)

    useEffect(() => {
        if (!path) return
        const controller = new AbortController()

        async function load(url: string) {
            try {
                const json = await sendRaw<TimelineResponse>(url, "GET", undefined, { signal: controller.signal })
                if (controller.signal.aborted) return
                setInteractions(json.interactions ?? [])
                setError(null)
            } catch (err) {
                if (isAbortError(err) || controller.signal.aborted) return
                if (err instanceof ApiError && err.status === 401) return
                setError(err instanceof Error ? err.message : "Failed to fetch interactions")
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        load(path)
        return () => controller.abort()
    }, [path, reloadCount])

    /** Fetches the timeline again, keeping the current rows on screen until the new ones arrive. */
    const reload = useCallback(() => setReloadCount((count) => count + 1), [])

    const hasFocusedRef = useRef(false)
    useFocusEffect(
        useCallback(() => {
            if (!hasFocusedRef.current) {
                hasFocusedRef.current = true
                return
            }
            reload()
        }, [reload]),
    )

    return { interactions, loading, error, reload }
}
