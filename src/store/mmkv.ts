import { createMMKV } from "react-native-mmkv"

import type { AuthUser } from "@/contexts/AuthContext"
import { ALL_REGIONS, REGION_CODES, type ActiveRegion } from "@/lib/region"

/**
 * Cache and preferences. Never the token: that lives in `src/store/keychain.ts`.
 *
 * Three kinds of entry:
 * - the session: the last `/api/auth/me` payload and the active region. Both go on logout and on login.
 * - the region-keyed cache: anything fetched under one region, stored as `cache.<region>.<key>`. It goes on a region
 *   switch, because it no longer matches what the person is looking at.
 * - preferences that outlive a session: only the last login email, so Login can prefill it.
 */

const storage = createMMKV({ id: "zanverse" })

const KEY = {
    ME: "session.me",
    ACTIVE_REGION: "session.activeRegion",
    LAST_EMAIL: "prefs.lastEmail",
} as const

const CACHE_PREFIX = "cache."
const SESSION_PREFIX = "session."

function readJson<T>(key: string): T | null {
    const raw = storage.getString(key)
    if (raw === undefined) return null
    try {
        return JSON.parse(raw) as T
    } catch {
        storage.remove(key)
        return null
    }
}

function removeByPrefix(prefix: string): void {
    for (const key of storage.getAllKeys()) {
        if (key.startsWith(prefix)) storage.remove(key)
    }
}

function isActiveRegion(value: unknown): value is ActiveRegion {
    return value === ALL_REGIONS || (REGION_CODES as readonly unknown[]).includes(value)
}

/** The last user `/api/auth/me` returned. Used when the app starts with no network. */
export function getCachedMe(): AuthUser | null {
    return readJson<AuthUser>(KEY.ME)
}

/** Stores the `/api/auth/me` payload, or removes it for `null`. */
export function saveCachedMe(user: AuthUser | null): void {
    if (user) storage.set(KEY.ME, JSON.stringify(user))
    else storage.remove(KEY.ME)
}

/** The region this device sends as `X-Active-Region`. `null` sends no header, which means everything held. */
export function getActiveRegion(): ActiveRegion | null {
    const value = storage.getString(KEY.ACTIVE_REGION)
    return isActiveRegion(value) ? value : null
}

/** Stores the region the server reported. Only ever pass `data.active` or `data.activeRegion` from the API. */
export function saveActiveRegion(region: ActiveRegion | null): void {
    if (region) storage.set(KEY.ACTIVE_REGION, region)
    else storage.remove(KEY.ACTIVE_REGION)
}

/** The email of the last successful login. Kept across logout so Login can prefill it. */
export function getLastEmail(): string {
    return storage.getString(KEY.LAST_EMAIL) ?? ""
}

/** Remembers the email after a successful login. */
export function saveLastEmail(email: string): void {
    storage.set(KEY.LAST_EMAIL, email)
}

/** Reads a cached value fetched under the current region. */
export function getRegionCache<T>(key: string): T | null {
    return readJson<T>(`${CACHE_PREFIX}${getActiveRegion() ?? ALL_REGIONS}.${key}`)
}

/** Caches a value under the current region. */
export function saveRegionCache(key: string, value: unknown): void {
    storage.set(`${CACHE_PREFIX}${getActiveRegion() ?? ALL_REGIONS}.${key}`, JSON.stringify(value))
}

/** Drops everything fetched under a region. Called on a region switch. */
export function clearRegionCache(): void {
    removeByPrefix(CACHE_PREFIX)
}

/**
 * Drops the session and the cache: the me payload, the region pin and every cached list. Called on logout, on login
 * (so user B never inherits user A's region pin) and on any 401. The last login email stays.
 */
export function clearAll(): void {
    removeByPrefix(SESSION_PREFIX)
    removeByPrefix(CACHE_PREFIX)
}
