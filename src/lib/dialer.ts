import { LEAD_SOURCE_STATUS } from "@/constants/leadSourceStatus"

// Session 11's import path for the call button. The body lives in contact.ts, next to WhatsApp and email.
export { startCall } from "./contact"

/**
 * Statuses whose number must not be dialed. The web has no separate "Do not call" status: Not Interested is defined
 * as "not interested, working with someone else, no need, do not call, wrong number", so it blocks calling. When the
 * backend adds a real do-not-call code, add it here; every call button reads this one list.
 */
const CALL_BLOCKED_STATUSES: number[] = [LEAD_SOURCE_STATUS.NOT_INTERESTED]

/** True when the call button for this status is disabled. */
export function isCallBlocked(status: number): boolean {
    return CALL_BLOCKED_STATUSES.includes(status)
}
