import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

import { send } from "@/api/client"
import { AUTH_API } from "@/api/endpoints"
import { notify } from "@/lib/notify"
import {
    ALL_REGIONS,
    DEFAULT_REGION,
    REGIONS,
    resolveEffectiveRegion,
    type ActiveRegion,
    type RegionCode,
    type RegionConfig,
} from "@/lib/region"
import { clearRegionCache, getCachedMe, saveActiveRegion, saveCachedMe } from "@/store/mmkv"

import { useAuth } from "./AuthContext"

/**
 * Which region the signed-in person is working in. Ported from the web's RegionContext.
 *
 * Two values, and the difference matters:
 *
 *   active   what the person is looking at. `"ALL"` when they hold more than
 *            one region and have not narrowed it.
 *
 *   config   the single region to use when something needs exactly one, such
 *            as parsing a phone number typed without a country code. `"ALL"`
 *            resolves to India.
 *
 * ## Switching
 *
 * `setActive` posts to `/api/auth/region` and stores the server's answer in MMKV. `client.ts` sends it as
 * `X-Active-Region` on every request, and the API narrows the region scope from it. The web reloads the page after a
 * switch; here the region-keyed cache is dropped and the navigation tree remounts, keyed on `active`.
 *
 * The server is the authority. This context is seeded from `/api/auth/me`, so a restart can never show a different
 * region from the one the APIs are using.
 */

interface RegionContextValue {
    /** Every region this person may read. Empty before /api/auth/me returns. */
    regions: RegionCode[]

    /** What they are looking at. `"ALL"` means every region they hold. */
    active: ActiveRegion

    /** Narrows the session, or restores everything with `"ALL"`. */
    setActive: (next: ActiveRegion) => Promise<void>

    /** True while a switch is in flight. */
    switching: boolean

    /** True when looking at everything rather than one region. */
    isAll: boolean

    /** True when there is anything to switch between. */
    canSwitch: boolean

    /** The single effective region. `"ALL"` resolves to India. */
    config: RegionConfig
}

interface RegionSwitchResult {
    active: ActiveRegion
    regions: RegionCode[]
}

/** A switch made in this run of the app, tied to the person who made it. */
interface RegionOverride {
    userId: string
    region: ActiveRegion
}

const FALLBACK: RegionContextValue = {
    regions: [],
    active: DEFAULT_REGION,
    setActive: async () => {},
    switching: false,
    isAll: false,
    canSwitch: false,
    config: REGIONS[DEFAULT_REGION],
}

const RegionContext = createContext<RegionContextValue>(FALLBACK)

/** Provides the region scope to the tree. Mount it inside AuthProvider. */
export function RegionProvider({ children }: { children: ReactNode }) {
    const { user, regions } = useAuth()

    // Set only after a switch. Until then the server's answer from /api/auth/me is used. Tied to the user, so the
    // next person to sign in never inherits it.
    const [override, setOverride] = useState<RegionOverride | null>(null)
    const [switching, setSwitching] = useState(false)

    const serverActive: ActiveRegion = user?.activeRegion ?? (regions.length === 1 ? regions[0] : ALL_REGIONS)

    const active: ActiveRegion = override && override.userId === user?.id ? override.region : serverActive

    const value = useMemo<RegionContextValue>(() => {
        async function setActive(next: ActiveRegion) {
            if (!user || next === active) return

            if (next !== ALL_REGIONS && !regions.includes(next)) return

            setSwitching(true)

            try {
                const data = await send<RegionSwitchResult>(AUTH_API.REGION, "POST", { region: next })

                // 1. Trust the server's answer, not the request, and send it on every request from now on.
                saveActiveRegion(data.active)
                const cached = getCachedMe()
                if (cached) saveCachedMe({ ...cached, activeRegion: data.active })

                // 2. Everything cached was fetched under the old region and is no longer what the person sees.
                clearRegionCache()

                // 3. A new `active` remounts the navigation tree, so every screen fetches again.
                setOverride({ userId: user.id, region: data.active })
            } catch (err) {
                notify.error(err instanceof Error ? err.message : "Failed to switch region")
            } finally {
                setSwitching(false)
            }
        }

        return {
            regions,
            active,
            setActive,
            switching,
            isAll: active === ALL_REGIONS,
            canSwitch: regions.length > 1,
            config: resolveEffectiveRegion(active),
        }
    }, [user, regions, active, switching])

    return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
}

/**
 * The single effective region. Phone inputs and anything else that needs one
 * country use this, and they do not have to care about the "all regions" case.
 */
export function useRegion(): RegionConfig {
    return useContext(RegionContext).config
}

/** The full picture: what they hold, what they are looking at, how to change it. */
export function useRegionScope(): RegionContextValue {
    return useContext(RegionContext)
}
