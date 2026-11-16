import type { StatusMeta } from "@/constants/statsPalette"
import type { MonthBucket } from "@/types/overallStats"

/** One pie slice in the shape gifted-charts reads, plus the payload key and the label for the legend. */
export interface PieSlice {
    key: string
    value: number
    color: string
    text: string
    label: string
}

// The web's fallback for a status key its palette does not know.
const FALLBACK_COLOR = "#737373"

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * The slices of one status card: every status with a count above 0, in payload order, coloured and labelled from its
 * palette. A key missing from the palette keeps its own name and the web's grey.
 */
export function toPieData({ byStatus, meta }: { byStatus: Record<string, number>; meta: Record<string, StatusMeta> }) {
    return Object.entries(byStatus)
        .filter(([, value]) => value > 0)
        .map(
            ([key, value]): PieSlice => ({
                key,
                value,
                color: meta[key]?.color ?? FALLBACK_COLOR,
                text: String(value),
                label: meta[key]?.label ?? key,
            }),
        )
}

/** A share of the total as a whole percent, 0 when the total is 0. The web's legend rule. */
export function getPercent(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0
}

/**
 * Rupees in the web's short form: `₹1.25 Cr` from one crore, `₹3.40 L` from one lakh, `₹12.5k` from one thousand,
 * else `₹950`. Ported from `INR_COMPACT`; written by hand because Hermes may lack the `en-IN` locale.
 */
export function formatInrCompact(n: number): string {
    if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`
    if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`
    return `₹${n}`
}

/**
 * Turns the API's sparse month list (only months with leads) into 12 slots, January first. A missing month becomes a
 * zero row. Ported unchanged from the web's Leadsovertimecard.tsx.
 */
export function fillMonths(months: MonthBucket[]): MonthBucket[] {
    const byMonth = new Map(months.map((m) => [m.month, m]))
    return Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1
        return byMonth.get(monthNum) ?? { month: monthNum, leads: 0, converted: 0 }
    })
}

/** The month chart's tap readout: "40% converted", or "No leads" for an empty month. The web tooltip's afterBody. */
export function getConvertedLine(month: MonthBucket | undefined): string {
    if (!month || month.leads === 0) return "No leads"
    return `${Math.round((month.converted / month.leads) * 100)}% converted`
}
