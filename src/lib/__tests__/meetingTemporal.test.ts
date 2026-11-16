import { getMeetingIcon } from "@/components/meetings/meetingIcons"
import { getMeetingTemporalStatus } from "@/lib/meetingTemporal"
import { Calendar, Check, RefreshCw } from "lucide-react-native"

describe("getMeetingTemporalStatus", () => {
    const now = new Date(2026, 9, 6, 10, 0, 0)

    it("says TODAY for any time on the same local day, before or after now", () => {
        expect(getMeetingTemporalStatus(new Date(2026, 9, 6, 8, 0), now)).toBe("TODAY")
        expect(getMeetingTemporalStatus(new Date(2026, 9, 6, 23, 30).toISOString(), now)).toBe("TODAY")
    })

    it("says UPCOMING after today and PAST before it", () => {
        expect(getMeetingTemporalStatus(new Date(2026, 9, 7, 0, 5), now)).toBe("UPCOMING")
        expect(getMeetingTemporalStatus(new Date(2026, 9, 5, 23, 55), now)).toBe("PAST")
    })
})

describe("getMeetingIcon", () => {
    it("maps the META icon names and falls back to Calendar", () => {
        expect(getMeetingIcon(2010)).toBe(Calendar)
        expect(getMeetingIcon(2020)).toBe(RefreshCw)
        expect(getMeetingIcon(2050)).toBe(Check)
        expect(getMeetingIcon(9999)).toBe(Calendar)
    })
})
