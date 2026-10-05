import {
    addDays,
    dayToLocalDate,
    daysBetween,
    formatDay,
    isDayString,
    resolveClientToday,
    toDayString,
    todayString,
    utcTodayString,
} from "@/lib/leadSourceDay"

// Local times are built with the Date(year, monthIndex, ...) constructor, so these tests pass in any time zone.

afterEach(() => {
    jest.useRealTimers()
})

describe("isDayString", () => {
    test("accepts a real calendar day and refuses an impossible one", () => {
        expect(isDayString("2026-02-28")).toBe(true)
        expect(isDayString("2026-02-30")).toBe(false)
    })

    test("handles leap years", () => {
        expect(isDayString("2028-02-29")).toBe(true)
        expect(isDayString("2026-02-29")).toBe(false)
    })

    test("refuses the wrong shape or type", () => {
        expect(isDayString("2026-13-01")).toBe(false)
        expect(isDayString("2026-9-24")).toBe(false)
        expect(isDayString("2026-09-24T00:00")).toBe(false)
        expect(isDayString(" 2026-09-24")).toBe(false)
        expect(isDayString(20260924)).toBe(false)
        expect(isDayString(null)).toBe(false)
    })
})

describe("toDayString", () => {
    test("23:59 and 00:01 local, two minutes apart, are different days", () => {
        expect(toDayString(new Date(2026, 8, 24, 23, 59))).toBe("2026-09-24")
        expect(toDayString(new Date(2026, 8, 25, 0, 1))).toBe("2026-09-25")
    })

    test("pads the month and the day", () => {
        expect(toDayString(new Date(2026, 0, 5, 12, 0))).toBe("2026-01-05")
    })

    test("todayString follows the local clock across midnight", () => {
        jest.useFakeTimers({ now: new Date(2026, 11, 31, 23, 59) })
        expect(todayString()).toBe("2026-12-31")
        jest.setSystemTime(new Date(2027, 0, 1, 0, 1))
        expect(todayString()).toBe("2027-01-01")
    })
})

describe("dayToLocalDate", () => {
    test("is local midnight of the day", () => {
        const date = dayToLocalDate("2026-09-24")
        expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([
            2026, 8, 24, 0, 0,
        ])
        expect(toDayString(date)).toBe("2026-09-24")
    })
})

describe("addDays and daysBetween", () => {
    test("addDays rolls over months, years and leap days", () => {
        expect(addDays("2026-02-28", 1)).toBe("2026-03-01")
        expect(addDays("2028-02-28", 1)).toBe("2028-02-29")
        expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
        expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
        expect(addDays("2026-09-24", 0)).toBe("2026-09-24")
        expect(addDays("2026-09-24", 30)).toBe("2026-10-24")
    })

    test("daysBetween counts whole days and is negative backwards", () => {
        expect(daysBetween("2026-09-24", "2026-09-25")).toBe(1)
        expect(daysBetween("2026-09-25", "2026-09-24")).toBe(-1)
        expect(daysBetween("2026-09-24", "2026-09-24")).toBe(0)
        expect(daysBetween("2026-03-01", "2026-03-31")).toBe(30)
        expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1)
    })

    test("they agree with each other", () => {
        for (const amount of [-400, -7, -1, 0, 1, 7, 59, 366]) {
            expect(daysBetween("2026-09-24", addDays("2026-09-24", amount))).toBe(amount)
        }
    })
})

describe("formatDay", () => {
    // 2026-09-24 is a Thursday.
    const TODAY = "2026-09-24"

    test("Today, Tomorrow and Yesterday", () => {
        expect(formatDay("2026-09-24", TODAY)).toBe("Today")
        expect(formatDay("2026-09-25", TODAY)).toBe("Tomorrow")
        expect(formatDay("2026-09-23", TODAY)).toBe("Yesterday")
    })

    test("a weekday within a week, either side", () => {
        expect(formatDay("2026-09-28", TODAY)).toBe("Mon 28 Sep")
        expect(formatDay("2026-09-20", TODAY)).toBe("Sun 20 Sep")
    })

    test("day and month a week or more away, and the year when it differs", () => {
        expect(formatDay("2026-10-10", TODAY)).toBe("10 Oct")
        expect(formatDay("2025-09-28", TODAY)).toBe("28 Sep 2025")
        expect(formatDay("2027-01-02", TODAY)).toBe("2 Jan 2027")
    })

    test("defaults to the local today", () => {
        jest.useFakeTimers({ now: new Date(2026, 8, 24, 9, 0) })
        expect(formatDay("2026-09-25")).toBe("Tomorrow")
    })
})

describe("utcTodayString and resolveClientToday", () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: new Date("2026-03-15T12:00:00Z") })
    })

    test("utcTodayString is the UTC calendar day", () => {
        expect(utcTodayString()).toBe("2026-03-15")
    })

    test("accepts a client day within one day of UTC", () => {
        expect(resolveClientToday("2026-03-14")).toBe("2026-03-14")
        expect(resolveClientToday("2026-03-15")).toBe("2026-03-15")
        expect(resolveClientToday("2026-03-16")).toBe("2026-03-16")
    })

    test("clamps a forged or wrong-clock day to the UTC day", () => {
        expect(resolveClientToday("2026-03-17")).toBe("2026-03-15")
        expect(resolveClientToday("2026-03-13")).toBe("2026-03-15")
        expect(resolveClientToday("2020-01-01")).toBe("2026-03-15")
    })

    test("clamps a value that is not a day string", () => {
        expect(resolveClientToday("2026-02-30")).toBe("2026-03-15")
        expect(resolveClientToday("today")).toBe("2026-03-15")
        expect(resolveClientToday(undefined)).toBe("2026-03-15")
    })
})
