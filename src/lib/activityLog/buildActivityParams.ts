import type { ActivityLogFilterState } from "@/types/activityLog"

/**
 * The activity-log query params, by the rules of the web's ActivityLogList `buildQuery`: the user from `forceUserId`
 * first, then the filter; the entity only when it is not "" (0 is Lead, a real value); `from` as picked; `to` moved to
 * the end of that day and sent as ISO, so the day itself is included; and the name search only when no user is set.
 * `page` and `limit` are added by useListQuery.
 */
export function buildActivityParams(filters: ActivityLogFilterState, forceUserId?: string): Record<string, string> {
    const params: Record<string, string> = {}
    if (forceUserId) params.userId = forceUserId
    else if (filters.userId) params.userId = filters.userId

    if (filters.entityType !== "") params.entityType = String(filters.entityType)
    if (filters.from) params.from = filters.from
    if (filters.to) {
        const [year, month, day] = filters.to.split("-").map(Number)
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
        if (!Number.isNaN(endOfDay.getTime())) params.to = endOfDay.toISOString()
    }
    if (!filters.userId && !forceUserId && filters.q.trim()) params.q = filters.q.trim()
    return params
}
