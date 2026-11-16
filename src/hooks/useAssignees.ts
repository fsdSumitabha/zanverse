import { useEffect, useState } from "react"

import { send } from "@/api/client"
import { LEAD_SOURCES_API } from "@/api/endpoints"
import { USER_ROLE_META, type UserRole } from "@/constants/userRoles"
import type { LeadSourceAssignee } from "@/types/leadSource"

/**
 * People who can take lead sources in all of `regions`. Empty `regions` means any region in view. Managers only:
 * pass `enabled: false` for anyone else, and nothing is fetched. Ported from the web's AssigneeSelect.tsx.
 */
export function useAssignees(regions: string[], enabled = true) {
    const key = [...regions].sort().join(",")
    const [people, setPeople] = useState<LeadSourceAssignee[]>([])
    const [loading, setLoading] = useState(enabled)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled) {
            setLoading(false)
            return
        }
        let cancelled = false
        setLoading(true)
        setError(null)
        send<LeadSourceAssignee[]>(`${LEAD_SOURCES_API}/assignees?regions=${encodeURIComponent(key)}`, "GET")
            .then((data) => {
                if (!cancelled) setPeople(data)
            })
            .catch((e: unknown) => {
                if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load people")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [key, enabled])

    return { people, loading, error }
}

/** A role's label, such as "Business Development Executive". */
export function roleLabel(role: number): string {
    return USER_ROLE_META[role as UserRole]?.label ?? "Unknown role"
}
