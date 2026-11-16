import { buildActivityParams } from "@/lib/activityLog/buildActivityParams"
import { formatActivityValue, humanizeFieldName, normalizeEntityType } from "@/lib/activityLog/formatActivityValue"
import { EMPTY_FILTERS } from "@/types/activityLog"

describe("formatActivityValue", () => {
    it("labels a status number on a Lead row and a role number", () => {
        expect(formatActivityValue(20, "status", 0)).toBe("Contacted")
        expect(formatActivityValue(20, "status", "LEAD")).toBe("Contacted")
        expect(formatActivityValue(60, "role", 3)).toBe("Business Development Executive")
        expect(formatActivityValue(99, "role", 3)).toBe("Role 99")
    })

    it("formats an ISO date with dayjs and shortens an ObjectId", () => {
        const iso = new Date(2026, 9, 6, 15, 7).toISOString()
        expect(formatActivityValue(iso, "scheduledAt", 5)).toBe("06 Oct 2026, 03:07 PM")
        expect(formatActivityValue("64b7f0c2a1b2c3d4e5f67f90", "assignedTo", 0)).toBe("64b7f0…7f90")
    })

    it("writes booleans, arrays and empty values as the web does", () => {
        expect(formatActivityValue(true, "isActive", 3)).toBe("Yes")
        expect(formatActivityValue(false, "isActive", 3)).toBe("No")
        expect(formatActivityValue([], "regions", 3)).toBe("(empty)")
        expect(formatActivityValue(["IN"], "regions", 3)).toBe("[1 item]")
        expect(formatActivityValue(null, "name", 0)).toBe("—")
        expect(formatActivityValue("", "name", 0)).toBe("—")
    })

    it("normalizes both entity type forms and humanizes field names", () => {
        expect(normalizeEntityType(1)).toBe(1)
        expect(normalizeEntityType("client")).toBe(1)
        expect(normalizeEntityType("nope")).toBeNull()
        expect(humanizeFieldName("lastInteractionAt")).toBe("Last interaction at")
        expect(humanizeFieldName(null)).toBe("field")
    })
})

describe("buildActivityParams", () => {
    it("sends entity 0 (Lead) and moves To to the end of that day", () => {
        const params = buildActivityParams({ ...EMPTY_FILTERS, entityType: 0, from: "2026-10-01", to: "2026-10-06" })
        expect(params).toEqual({
            entityType: "0",
            from: "2026-10-01",
            to: new Date(2026, 9, 6, 23, 59, 59, 999).toISOString(),
        })
    })

    it("prefers the forced user and drops the name search when a user is set", () => {
        expect(buildActivityParams({ ...EMPTY_FILTERS, userId: "u2", q: "ravi" }, "u1")).toEqual({ userId: "u1" })
        expect(buildActivityParams({ ...EMPTY_FILTERS, userId: "u2", q: "ravi" })).toEqual({ userId: "u2" })
        expect(buildActivityParams({ ...EMPTY_FILTERS, q: "  ravi " })).toEqual({ q: "ravi" })
        expect(buildActivityParams(EMPTY_FILTERS)).toEqual({})
    })
})
