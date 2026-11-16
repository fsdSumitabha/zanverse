import type { AuthUser } from "@/contexts/AuthContext"
import type { LeadSourceListResponse } from "@/types/leadSource"

import { getCachedMe, getRegionCache, saveCachedMe, saveRegionCache } from "./mmkv"

/** The Lead Sources Today page 1 as it was last loaded, with the day it was for. */
export type LeadSourcesTodayPage = Pick<LeadSourceListResponse, "data" | "pagination" | "counts" | "progress"> & {
    today: string
    savedAt: number
}

interface MeEntry {
    user: AuthUser
    savedAt: number
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000
const LEAD_SOURCES_TODAY_KEY = "leadSourcesToday"

function isFresh(savedAt: unknown, now: number): boolean {
    return typeof savedAt === "number" && now - savedAt <= MAX_AGE_MS
}

/**
 * The last signed-in user, for a start that shows the app at once. Older than 24 hours, or saved by an older version
 * of the app without a time, reads as nothing. It lives with the session, so logout clears it, and a region switch
 * rewrites its `activeRegion` (RegionContext) rather than dropping it.
 */
export function readCachedMe(now: number = Date.now()): AuthUser | null {
    const entry = getCachedMe<MeEntry>()
    if (!entry?.user || !isFresh(entry.savedAt, now)) return null
    return entry.user
}

/** Stores the `/api/auth/me` user with the time it arrived, or removes it for `null`. */
export function writeCachedMe(user: AuthUser | null, now: number = Date.now()): void {
    saveCachedMe(user ? { user, savedAt: now } : null)
}

/**
 * The saved Today page 1 for the current region. It is ignored when older than 24 hours, or when it was for another
 * day than `today`: a page from yesterday sorts callbacks against the wrong day.
 */
export function readLeadSourcesToday(today: string, now: number = Date.now()): LeadSourcesTodayPage | null {
    const page = getRegionCache<LeadSourcesTodayPage>(LEAD_SOURCES_TODAY_KEY)
    if (!page || page.today !== today || !isFresh(page.savedAt, now) || !Array.isArray(page.data)) return null
    return page
}

/** Saves the Today page 1 under the current region. A region switch and logout clear it with the rest of the cache. */
export function writeLeadSourcesToday(
    json: Pick<LeadSourceListResponse, "data" | "pagination" | "counts" | "progress">,
    today: string,
    now: number = Date.now(),
): void {
    const page: LeadSourcesTodayPage = {
        data: json.data,
        pagination: json.pagination,
        counts: json.counts,
        progress: json.progress,
        today,
        savedAt: now,
    }
    saveRegionCache(LEAD_SOURCES_TODAY_KEY, page)
}
