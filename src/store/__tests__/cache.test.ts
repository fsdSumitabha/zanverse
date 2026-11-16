import type { AuthUser } from "@/contexts/AuthContext"
import { readCachedMe, readLeadSourcesToday, writeCachedMe, writeLeadSourcesToday } from "@/store/cache"
import { clearAll, clearRegionCache, getActiveRegion, saveActiveRegion, saveCachedMe } from "@/store/mmkv"

const USER: AuthUser = { id: "u1", name: "Asha Rao", role: 10, regions: ["IN", "US"], activeRegion: "IN" }
const NOW = new Date(2026, 9, 6, 10, 0).getTime()
const HOUR = 60 * 60 * 1000
const PAGE = {
    data: [],
    pagination: { page: 1, limit: 50, total: 0, pages: 0 },
    counts: { today: 0, upcoming: 0, unscheduled: 0, closed: 0, all: 0, callbacksDue: 0 },
    progress: { total: 0, worked: 0 },
}

beforeEach(() => {
    clearAll()
    saveActiveRegion("IN")
})

describe("the me cache", () => {
    it("reads back within 24 hours, and not after", () => {
        writeCachedMe(USER, NOW)
        expect(readCachedMe(NOW + 23 * HOUR)).toEqual(USER)
        expect(readCachedMe(NOW + 25 * HOUR)).toBeNull()
    })

    it("ignores an entry saved without a time by the earlier version", () => {
        saveCachedMe(USER)
        expect(readCachedMe(NOW)).toBeNull()
    })

    it("survives a region switch, and dies on logout", () => {
        writeCachedMe(USER, NOW)
        clearRegionCache()
        expect(readCachedMe(NOW)).toEqual(USER)
        clearAll()
        expect(readCachedMe(NOW)).toBeNull()
        expect(getActiveRegion()).toBeNull()
    })
})

describe("the Lead Sources Today cache", () => {
    it("reads back for the same day within 24 hours", () => {
        writeLeadSourcesToday(PAGE, "2026-10-06", NOW)
        expect(readLeadSourcesToday("2026-10-06", NOW + HOUR)).toEqual({ ...PAGE, today: "2026-10-06", savedAt: NOW })
    })

    it("is ignored on another day, or after 24 hours", () => {
        writeLeadSourcesToday(PAGE, "2026-10-06", NOW)
        expect(readLeadSourcesToday("2026-10-07", NOW + HOUR)).toBeNull()
        expect(readLeadSourcesToday("2026-10-06", NOW + 25 * HOUR)).toBeNull()
    })

    it("belongs to the region it was saved under, and dies on a region switch and on logout", () => {
        writeLeadSourcesToday(PAGE, "2026-10-06", NOW)
        saveActiveRegion("US")
        expect(readLeadSourcesToday("2026-10-06", NOW)).toBeNull()
        saveActiveRegion("IN")
        expect(readLeadSourcesToday("2026-10-06", NOW)).not.toBeNull()

        clearRegionCache()
        expect(readLeadSourcesToday("2026-10-06", NOW)).toBeNull()
        writeLeadSourcesToday(PAGE, "2026-10-06", NOW)
        clearAll()
        expect(readLeadSourcesToday("2026-10-06", NOW)).toBeNull()
    })
})
