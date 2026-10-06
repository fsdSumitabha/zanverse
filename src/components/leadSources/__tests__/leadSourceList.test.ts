import { buildListLayout } from "@/components/leadSources/listItems"
import {
    getDayChip,
    getRowHeight,
    ROW_HEIGHT,
    ROW_HEIGHT_WITH_CHIPS,
    SECTION_HEIGHT,
} from "@/components/leadSources/rowLayout"
import { EMPTY_LEAD_SOURCE_FILTERS, buildLeadSourceQuery } from "@/lib/leadSourceQuery"
import { BULK_MAX, reportBulkResult, runBulk } from "@/lib/leadSourceBulk"
import { notify } from "@/lib/notify"
import type { LeadSourceRow } from "@/types/leadSource"

import { EMPTY_CHOICE, resolveChoice } from "@/components/leadSources/CallbackPicker"

const TODAY = "2026-10-06"

function makeRow(overrides: Partial<LeadSourceRow> = {}): LeadSourceRow {
    return {
        _id: "r1",
        name: "Acme",
        company: "",
        email: "",
        phone: "+919876543210",
        status: 10,
        region: "IN",
        allottedDay: TODAY,
        callbackAt: null,
        lastNote: "",
        lastNoteAt: null,
        uploadId: null,
        rowNumber: null,
        convertedLeadId: null,
        assignee: null,
        listInfo: [],
        ...overrides,
    }
}

describe("buildLeadSourceQuery", () => {
    it("builds the web's query in its order", () => {
        expect(buildLeadSourceQuery(EMPTY_LEAD_SOURCE_FILTERS, 1, 50, TODAY)).toBe(
            "view=today&today=2026-10-06&page=1&limit=50",
        )
        expect(
            buildLeadSourceQuery(
                { view: "closed", status: "50", assignee: "me", upload: "u1", day: "", search: "acme co" },
                2,
                50,
                TODAY,
            ),
        ).toBe("view=closed&today=2026-10-06&page=2&limit=50&search=acme%20co&status=50&assignee=me&upload=u1")
    })

    it("sends view=all with the day for the one-day view", () => {
        const query = buildLeadSourceQuery(
            { ...EMPTY_LEAD_SOURCE_FILTERS, view: "upcoming", day: "2026-10-09" },
            1,
            50,
            TODAY,
        )
        expect(query).toBe("view=all&today=2026-10-06&page=1&limit=50&day=2026-10-09")
    })
})

describe("bulk helpers", () => {
    it("reports the counts in the web's words", () => {
        const success = jest.spyOn(notify, "success").mockImplementation(() => undefined)
        reportBulkResult({ updated: 3, unchanged: 1, skipped: 2 }, "marked Not Reached")
        reportBulkResult({ updated: 1, unchanged: 0, skipped: 0 }, "deleted")
        expect(success.mock.calls.map(([message]) => message)).toEqual([
            "3 lead sources marked Not Reached. 1 already set. 2 skipped.",
            "1 lead source deleted.",
        ])
    })

    it("refuses more than 200 ids before asking the server", async () => {
        const fetchMock = jest.fn()
        globalThis.fetch = fetchMock as unknown as typeof fetch
        const ids = Array.from({ length: BULK_MAX + 1 }, (_, i) => `id${i}`)
        await expect(runBulk("delete", ids)).rejects.toThrow("Select 200 or fewer lead sources at a time.")
        expect(fetchMock).not.toHaveBeenCalled()
    })
})

describe("row layout", () => {
    it("shows a day chip on Today only for rows left over from earlier days", () => {
        expect(getDayChip(makeRow({ section: 1 }), "today", TODAY)).toBeNull()
        const late = getDayChip(makeRow({ section: 2, allottedDay: "2026-10-04", status: 20 }), "today", TODAY)
        expect(late?.title).toBe("Set for Sun 4 Oct, 2 days ago, and still open")
    })

    it("tones a late open row amber on the other tabs, and never shows a chip in the one-day view", () => {
        const late = makeRow({ allottedDay: "2026-10-04" })
        expect(getDayChip(late, "all", TODAY)?.tone).toContain("amber")
        expect(getDayChip({ ...late, status: 70 }, "all", TODAY)?.tone).toContain("slate")
        expect(getDayChip(late, "day", TODAY)).toBeNull()
    })

    it("makes a row taller only when it has a chip", () => {
        expect(getRowHeight(makeRow({ section: 1 }), "today", TODAY)).toBe(ROW_HEIGHT)
        expect(getRowHeight(makeRow({ callbackAt: "2026-10-06T12:00:00Z" }), "today", TODAY)).toBe(
            ROW_HEIGHT_WITH_CHIPS,
        )
    })
})

describe("buildListLayout", () => {
    it("puts a header before each run of a section on Today, with offsets for getItemLayout", () => {
        const rows = [
            makeRow({ _id: "a", section: 0, callbackAt: "2026-10-06T08:00:00Z" }),
            makeRow({ _id: "b", section: 1 }),
            makeRow({ _id: "c", section: 1 }),
            makeRow({ _id: "d", section: 2, allottedDay: "2026-10-01" }),
        ]
        const layout = buildListLayout(rows, "today", TODAY)

        expect(layout.items.map((item) => (item.kind === "section" ? `s${item.section}` : item.key))).toEqual([
            "s0",
            "a",
            "s1",
            "b",
            "c",
            "s2",
            "d",
        ])
        expect(layout.sectionIndices).toEqual([0, 2, 5])
        expect(layout.offsets.slice(0, 4)).toEqual([
            0,
            SECTION_HEIGHT,
            SECTION_HEIGHT + ROW_HEIGHT_WITH_CHIPS,
            2 * SECTION_HEIGHT + ROW_HEIGHT_WITH_CHIPS,
        ])
    })

    it("has no headers outside Today", () => {
        const layout = buildListLayout([makeRow({ section: 0 })], "all", TODAY)
        expect(layout.sectionIndices).toEqual([])
        expect(layout.items).toHaveLength(1)
    })
})

describe("resolveChoice", () => {
    it("reads a preset from now, an exact time as local, and nothing as null", () => {
        jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })
        expect(resolveChoice(EMPTY_CHOICE)).toBeNull()
        expect(resolveChoice({ preset: 3, custom: "" })?.getTime()).toBe(new Date(2026, 9, 6, 12, 0, 0).getTime())
        expect(resolveChoice({ preset: null, custom: "2026-10-07T09:30" })?.getHours()).toBe(9)
        jest.useRealTimers()
    })
})
