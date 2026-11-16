import { useState } from "react"

import { useRegionScope } from "@/contexts/RegionContext"
import { ALL_REGIONS, DEFAULT_REGION, type RegionCode } from "@/lib/region"

/**
 * The region a new lead or client is saved in. Ported from the web's WriteRegionField.tsx.
 *
 * The choices are the regions the person is viewing now, not every region
 * they hold:
 *
 *   - Viewing all regions: a choice, India preselected.
 *   - Pinned to one region, or holding only one: that region, fixed.
 *
 * Pinned is fixed on purpose. The form opens the new record after saving,
 * and a session pinned to US cannot read an IN record, so the screen would say
 * "not found". The server applies the same rule in resolveWriteRegion.
 */
export function useWriteRegion() {
    const { regions, active } = useRegionScope()

    const options: RegionCode[] = active === ALL_REGIONS ? regions : [active]

    // Null until the person picks. Until then the default follows the
    // options, which are empty until /api/auth/me returns.
    const [picked, setPicked] = useState<RegionCode | null>(null)

    const fallback = options.includes(DEFAULT_REGION) ? DEFAULT_REGION : options[0] ?? null

    const value = picked && options.includes(picked) ? picked : fallback

    return {
        value,
        setValue: setPicked,
        options,
        pinned: active !== ALL_REGIONS && regions.length > 1,
    }
}

export type WriteRegion = ReturnType<typeof useWriteRegion>
