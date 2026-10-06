/**
 * The two upload limits from the web's src/config/leadSourceSheet.ts (LEAD_SOURCE_SHEET_RULES), copied as the
 * fallback for the local file check. The upload screen prefers the values from `GET /lead-sources/columns` when the
 * API has that route. When they change on the web, copy them here too.
 */
export const LEAD_SOURCE_SHEET_RULES = {
    /** The biggest file accepted, in megabytes. */
    maxFileMb: 5,
    /** The most data rows in one file. Empty rows do not count. */
    maxRows: 5000,
} as const
