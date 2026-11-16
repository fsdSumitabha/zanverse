import {
    CALLBACK_PRESETS,
    callbackPayload,
    callbackState,
    formatCallback,
    relativeCallback,
    toDateTimeLocal,
} from "@/lib/callback"
import { toDayString } from "@/lib/leadSourceDay"

const MINUTE = 60_000
const NOW = Date.UTC(2026, 8, 24, 10, 0, 0)

function isoAt(offsetMs: number): string {
    return new Date(NOW + offsetMs).toISOString()
}

// The same call callback.ts makes. Its output follows the device locale, so the tests build it the same way.
function clock(date: Date): string {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

afterEach(() => {
    jest.useRealTimers()
})

describe("CALLBACK_PRESETS", () => {
    test("offers the web's quick choices, in order", () => {
        expect(CALLBACK_PRESETS.map((preset) => preset.label)).toEqual([
            "15 min",
            "30 min",
            "1 hour",
            "2 hours",
            "4 hours",
            "Tomorrow 10 AM",
        ])
    })

    test("minute presets count from now and drop the seconds", () => {
        jest.useFakeTimers({ now: new Date(2026, 8, 24, 10, 7, 42, 500) })
        expect(CALLBACK_PRESETS[0].at()).toEqual(new Date(2026, 8, 24, 10, 22, 0, 0))
        expect(CALLBACK_PRESETS[4].at()).toEqual(new Date(2026, 8, 24, 14, 7, 0, 0))
    })

    test("Tomorrow 10 AM is 10:00 local on the next day, even from late at night", () => {
        jest.useFakeTimers({ now: new Date(2026, 11, 31, 23, 30) })
        expect(CALLBACK_PRESETS[5].at()).toEqual(new Date(2027, 0, 1, 10, 0, 0, 0))
    })
})

describe("callbackPayload", () => {
    test("sends the ISO time and the local day", () => {
        const at = new Date(2026, 8, 24, 23, 30)
        expect(callbackPayload(at)).toEqual({ callbackAt: at.toISOString(), callbackDay: "2026-09-24" })
        expect(callbackPayload(at).callbackDay).toBe(toDayString(at))
    })
})

describe("callbackState", () => {
    test("due at or after the time", () => {
        expect(callbackState(isoAt(0), NOW)).toBe("due")
        expect(callbackState(isoAt(-5 * MINUTE), NOW)).toBe("due")
    })

    test("soon up to and including 15 minutes ahead", () => {
        expect(callbackState(isoAt(1), NOW)).toBe("soon")
        expect(callbackState(isoAt(15 * MINUTE), NOW)).toBe("soon")
    })

    test("later beyond 15 minutes", () => {
        expect(callbackState(isoAt(15 * MINUTE + 1), NOW)).toBe("later")
        expect(callbackState(isoAt(3 * 60 * MINUTE), NOW)).toBe("later")
    })
})

describe("relativeCallback", () => {
    test("minutes either side, and due now within half a minute", () => {
        expect(relativeCallback(isoAt(25 * MINUTE), NOW)).toBe("in 25 min")
        expect(relativeCallback(isoAt(-5 * MINUTE), NOW)).toBe("5 min ago")
        expect(relativeCallback(isoAt(20_000), NOW)).toBe("due now")
        expect(relativeCallback(isoAt(-20_000), NOW)).toBe("due now")
    })

    test("hours and days", () => {
        expect(relativeCallback(isoAt(3 * 60 * MINUTE), NOW)).toBe("in 3 h")
        expect(relativeCallback(isoAt(-2 * 60 * MINUTE), NOW)).toBe("2 h ago")
        expect(relativeCallback(isoAt(2 * 24 * 60 * MINUTE), NOW)).toBe("in 2 d")
    })
})

describe("formatCallback", () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2026, 8, 24, 9, 0) })
    })

    test("only the time for today", () => {
        const at = new Date(2026, 8, 24, 15, 0)
        expect(formatCallback(at.toISOString())).toBe(clock(at))
    })

    test("the day name and the time for another day", () => {
        const tomorrow = new Date(2026, 8, 25, 10, 0)
        expect(formatCallback(tomorrow.toISOString())).toBe(`Tomorrow ${clock(tomorrow)}`)
        const monday = new Date(2026, 8, 28, 10, 0)
        expect(formatCallback(monday.toISOString())).toBe(`Mon 28 Sep ${clock(monday)}`)
    })
})

describe("toDateTimeLocal", () => {
    test("is the local date and time, padded, without seconds", () => {
        expect(toDateTimeLocal(new Date(2026, 0, 5, 9, 7, 59))).toBe("2026-01-05T09:07")
    })
})
