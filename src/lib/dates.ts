// Ported from the web's ListFilters.tsx unchanged: the list filters' date range.

/** Earliest selectable date — the pipeline starts in 2026. */
export const MIN_DATE = "2026-01-01"

/** Local "today" as YYYY-MM-DD (avoids the UTC drift of toISOString). */
export function todayLocal(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

/** Clamp a YYYY-MM-DD string into [MIN_DATE, today]. */
export function clampDate(value: string, today: string): string {
    if (value < MIN_DATE) return MIN_DATE
    if (value > today) return today
    return value
}

/** A YYYY-MM-DD string as a local Date at midnight, for the date picker. */
export function parseLocalDate(value: string): Date {
    const [y, m, d] = value.split("-").map(Number)
    return new Date(y, m - 1, d)
}

/** A Date as a local YYYY-MM-DD string, the format the API takes. */
export function formatLocalDate(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}
