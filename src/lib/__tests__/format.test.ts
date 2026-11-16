import {
    formatAmount,
    formatDate,
    formatDateTime,
    formatDayTime,
    formatFullDateTime,
    formatShortDate,
    formatTime,
    formatTimeAgo,
} from "@/lib/format"

// 2026-10-05 is a Monday. Built with the local constructor, so the tests pass in any time zone.
const MOMENT = new Date(2026, 9, 5, 15, 7)

afterEach(() => {
    jest.useRealTimers()
})

describe("date and time formats", () => {
    test("each format, from a Date", () => {
        expect(formatDateTime(MOMENT)).toBe("Oct 5, 2026 3:07 PM")
        expect(formatDate(MOMENT)).toBe("Oct 5, 2026")
        expect(formatShortDate(MOMENT)).toBe("Oct 5")
        expect(formatTime(MOMENT)).toBe("3:07 PM")
        expect(formatDayTime(MOMENT)).toBe("Mon, 3:07 PM")
        expect(formatFullDateTime(MOMENT)).toBe("05/10/2026 03:07 PM")
    })

    test("an ISO string from the API and a timestamp read as the same local moment", () => {
        expect(formatDateTime(MOMENT.toISOString())).toBe("Oct 5, 2026 3:07 PM")
        expect(formatDateTime(MOMENT.getTime())).toBe("Oct 5, 2026 3:07 PM")
    })

    test("a YYYY-MM-DD day string is that local day, never shifted by the time zone", () => {
        expect(formatShortDate("2026-10-05")).toBe("Oct 5")
        expect(formatDate("2026-01-01")).toBe("Jan 1, 2026")
    })

    test("midnight and noon use the 12-hour clock", () => {
        expect(formatTime(new Date(2026, 9, 5, 0, 0))).toBe("12:00 AM")
        expect(formatTime(new Date(2026, 9, 5, 12, 30))).toBe("12:30 PM")
    })

    test("a missing or unreadable value shows the placeholder, never the current time", () => {
        for (const value of [undefined, null, "", "not a date"]) {
            expect(formatDateTime(value)).toBe("—")
            expect(formatTimeAgo(value)).toBe("—")
        }
    })
})

describe("formatTimeAgo", () => {
    test("reads relative to now, past and future", () => {
        jest.useFakeTimers({ now: MOMENT })
        expect(formatTimeAgo(new Date(2026, 9, 5, 15, 2))).toBe("5 minutes ago")
        expect(formatTimeAgo(new Date(2026, 9, 5, 17, 7))).toBe("in 2 hours")
        expect(formatTimeAgo(new Date(2026, 9, 5, 15, 6, 30))).toBe("a few seconds ago")
        expect(formatTimeAgo(new Date(2026, 9, 2, 15, 7).toISOString())).toBe("3 days ago")
    })
})

describe("formatAmount", () => {
    test("uses Indian digit grouping", () => {
        expect(formatAmount(125000)).toBe("1,25,000")
        expect(formatAmount(10000000)).toBe("1,00,00,000")
        expect(formatAmount(1234.5)).toBe("1,234.5")
        expect(formatAmount(-2500)).toBe("-2,500")
        expect(formatAmount(0)).toBe("0")
    })

    test("a missing or non-finite amount shows the placeholder", () => {
        expect(formatAmount(undefined)).toBe("—")
        expect(formatAmount(null)).toBe("—")
        expect(formatAmount(NaN)).toBe("—")
        expect(formatAmount(Infinity)).toBe("—")
    })
})
