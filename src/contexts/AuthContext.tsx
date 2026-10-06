import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import { isNetworkError, send, setUnauthorizedListener } from "@/api/client"
import { AUTH_API } from "@/api/endpoints"
import { resetToLogin } from "@/api/navigationRef"
import type { UserRole } from "@/constants/userRoles"
import { notify } from "@/lib/notify"
import { registerDeviceToken, unregisterDeviceToken } from "@/lib/push/token"
import type { ActiveRegion, RegionCode } from "@/lib/region"
import { readCachedMe, writeCachedMe } from "@/store/cache"
import { clearToken, getToken, loadToken } from "@/store/keychain"
import { clearAll, saveActiveRegion } from "@/store/mmkv"

/** The signed-in person, as `/api/auth/me` returns them. Same fields as the web's AuthUser. */
export interface AuthUser {
    id: string
    name?: string
    email?: string
    role: UserRole

    /**
     * Regions this user may see. Admin holds every code.
     * Comes from /api/auth/me, which reads the user row, not the token.
     */
    regions: RegionCode[]

    /**
     * What this session is narrowed to. `"ALL"` means every region above.
     * Worked out server-side, so it always matches what the APIs will do.
     */
    activeRegion: ActiveRegion

    /** An ImageKit URL, or a legacy path under `/public` such as `/uploads/avatars/...`. */
    avatar?: string
}

interface AuthContextType {
    user: AuthUser | null
    loading: boolean
    isAuthenticated: boolean
    role: UserRole | null

    /** Empty until /api/auth/me returns. Never assume it has a value. */
    regions: RegionCode[]

    /** Asks /api/auth/me again. Resolves to the user, or `null` when signed out. */
    refreshUser: () => Promise<AuthUser | null>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Settles when the first boot has asked /api/auth/me. Deep links wait on it, so a link never opens a signed-in screen
// for a dead session.
let resolveAuthBoot: (isSignedIn: boolean) => void = () => {}
const authBoot = new Promise<boolean>((resolve) => {
    resolveAuthBoot = resolve
})

/** Resolves once the app knows whether someone is signed in. */
export function waitForAuthBoot(): Promise<boolean> {
    return authBoot
}

/**
 * The session. Ported from the web's AuthContext.
 *
 * Differences a phone needs: the JWT is read from Keychain at boot, `/api/auth/me` is skipped when there is no token,
 * a start with a cached user opens the app at once and checks `/api/auth/me` behind it, a start with no network keeps
 * the last cached user, and logout navigates at once instead of after 500 ms.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    async function fetchUser({ isBehindCache = false } = {}): Promise<AuthUser | null> {
        try {
            // No token means signed out. The server would answer `data: null`, so the round trip is skipped.
            if (!getToken()) {
                setUser(null)
                return null
            }

            const data = await send<AuthUser | null>(AUTH_API.ME, "GET")

            // "Signed out" is `data === null` on a 200, never a status. The token is missing, expired or invalid,
            // or the account was deactivated, so the stored session is dead.
            if (!data) {
                await clearToken()
                clearAll()
                setUser(null)
                // The app already opened from the cache, so Splash is gone and cannot route to Login.
                if (isBehindCache) resetToLogin()
                return null
            }

            // Seed the region from the server, so the device never disagrees with what the APIs will do.
            saveActiveRegion(data.activeRegion)
            writeCachedMe(data)
            setUser(data)
            // After login and on every start: the backend gets this phone's push token. Fire-and-forget.
            registerDeviceToken()
            return data
        } catch (error) {
            // Opened from the cache: keep that user through any failure. Only `data: null` or a 401 ends the session.
            const cached = getToken() ? readCachedMe() : null
            if (isBehindCache) return cached
            // Started with no network: keep working from the last known user. Writes are disabled while offline.
            const fallback = isNetworkError(error) ? cached : null
            setUser(fallback)
            return fallback
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        async function bootstrap() {
            await loadToken()

            // 1. A token and a fresh cached user: open the app now, with the name in the header and no wait.
            const cached = getToken() ? readCachedMe() : null
            if (cached) {
                setUser(cached)
                setLoading(false)
                resolveAuthBoot(true)
                // 2. Still ask the server, behind the app. `data: null` logs out from there.
                fetchUser({ isBehindCache: true })
                return
            }

            // No cache: wait for the server, as before.
            const bootUser = await fetchUser()
            resolveAuthBoot(bootUser !== null)
        }

        bootstrap()
        // A 401 anywhere has already cleared the token and gone to Login. This drops the user to match.
        setUnauthorizedListener(() => setUser(null))
        return () => setUnauthorizedListener(null)
    }, [])

    async function refreshUser(): Promise<AuthUser | null> {
        setLoading(true)
        return fetchUser()
    }

    async function logout(): Promise<void> {
        // 1. Tell the server without waiting. It clears a cookie the app never had, so the result does not matter.
        send(AUTH_API.LOGOUT, "POST").catch(() => undefined)
        // The push token goes too, while the request can still carry the session's JWT.
        unregisterDeviceToken()

        // 2. Forget the session on the device: the token, the cached user, the region pin and every cached list.
        await clearToken()
        clearAll()
        setUser(null)

        // 3. Straight to Login. The web waits 500 ms here so the toast is seen; the toast host outlives the screen.
        notify.success("Logged out successfully")
        resetToLogin()
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                role: user?.role ?? null,
                regions: user?.regions ?? [],
                refreshUser,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

/** The session: who is signed in, and how to refresh or end it. */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }

    return context
}
