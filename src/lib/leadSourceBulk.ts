import { send } from "@/api/client"
import { LEAD_SOURCES_API } from "@/api/endpoints"

import { todayString } from "./leadSourceDay"
import { notify } from "./notify"

/** What the bulk route reports. */
export interface BulkResult {
    /** Rows that changed. */
    updated: number
    /** Rows that already had that value. */
    unchanged: number
    /** Ids the caller cannot see, deleted, or not allowed for this action. */
    skipped: number
}

export type BulkAction = "assign" | "day" | "status" | "delete"

/** The bulk route's limit (BULK_MAX in the web's mutations.ts). */
export const BULK_MAX = 200

function plural(n: number, word: string): string {
    return `${n} ${word}${n === 1 ? "" : "s"}`
}

/** "3 lead sources", "1 lead source". */
export function pluralSources(n: number): string {
    return plural(n, "lead source")
}

/**
 * Sends one bulk action for the selected rows, with today's local day. Ported from the web's ActionDialogs.tsx.
 * Refuses more than 200 ids before asking the server, which would refuse them too.
 */
export async function runBulk(
    action: BulkAction,
    ids: string[],
    body: Record<string, unknown> = {},
): Promise<BulkResult> {
    if (ids.length > BULK_MAX) {
        throw new Error(`Select ${BULK_MAX} or fewer lead sources at a time.`)
    }
    return send<BulkResult>(`${LEAD_SOURCES_API}/bulk`, "POST", { ...body, action, ids, today: todayString() })
}

/** "3 lead sources marked Not Reached. 1 already set. 2 skipped." as a success toast. */
export function reportBulkResult(result: BulkResult, verb: string): void {
    const parts = [`${pluralSources(result.updated)} ${verb}`]
    if (result.unchanged) parts.push(`${result.unchanged} already set`)
    if (result.skipped) parts.push(`${result.skipped} skipped`)
    notify.success(parts.join(". ") + ".")
}
