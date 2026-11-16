import { STATS_PALETTE } from "@/constants/statsPalette"
import { getConversionLabel } from "@/components/stats/KpiRow"
import { getRoleCountLabel } from "@/components/stats/RoleCountsCard"
import { fillMonths, formatInrCompact, getConvertedLine, getPercent, toPieData } from "@/lib/statsChart"

describe("formatInrCompact", () => {
    it("keeps the web's Cr / L / k thresholds", () => {
        expect(formatInrCompact(950)).toBe("₹950")
        expect(formatInrCompact(1_000)).toBe("₹1.0k")
        expect(formatInrCompact(12_500)).toBe("₹12.5k")
        expect(formatInrCompact(99_999)).toBe("₹100.0k")
        expect(formatInrCompact(1_00_000)).toBe("₹1.00 L")
        expect(formatInrCompact(12_50_000)).toBe("₹12.50 L")
        expect(formatInrCompact(1_00_00_000)).toBe("₹1.00 Cr")
        expect(formatInrCompact(3_45_60_000)).toBe("₹3.46 Cr")
    })
})

describe("toPieData", () => {
    it("keeps the statuses above 0 in payload order, with palette colours and labels", () => {
        const slices = toPieData({
            byStatus: { new: 2, contacted: 0, converted: 1, mystery: 4 },
            meta: STATS_PALETTE.LEAD_STATUS_META,
        })
        expect(slices).toEqual([
            { key: "new", value: 2, color: "#94a3b8", text: "2", label: "New" },
            { key: "converted", value: 1, color: "#10b981", text: "1", label: "Converted" },
            { key: "mystery", value: 4, color: "#737373", text: "4", label: "mystery" },
        ])
    })
})

describe("stats helpers", () => {
    it("rounds a share and gives 0 for a total of 0", () => {
        expect(getPercent(1, 3)).toBe(33)
        expect(getPercent(2, 3)).toBe(67)
        expect(getPercent(5, 0)).toBe(0)
    })

    it("fills 12 months, January first, with zero rows for the gaps", () => {
        const months = fillMonths([
            { month: 3, leads: 10, converted: 2 },
            { month: 11, leads: 1, converted: 0 },
        ])
        expect(months).toHaveLength(12)
        expect(months[0]).toEqual({ month: 1, leads: 0, converted: 0 })
        expect(months[2]).toEqual({ month: 3, leads: 10, converted: 2 })
        expect(months[10]).toEqual({ month: 11, leads: 1, converted: 0 })
    })

    it("reads a month as its converted share, or No leads", () => {
        expect(getConvertedLine({ month: 3, leads: 10, converted: 2 })).toBe("20% converted")
        expect(getConvertedLine({ month: 4, leads: 0, converted: 0 })).toBe("No leads")
        expect(getConvertedLine(undefined)).toBe("No leads")
    })

    it("shows — for a null conversion rate instead of NaN%", () => {
        expect(getConversionLabel(null)).toBe("—")
        expect(getConversionLabel(0.75)).toBe("75%")
        expect(getConversionLabel(0)).toBe("0%")
    })

    it("names a role from the constants, or by its code", () => {
        expect(getRoleCountLabel(60)).toBe("Business Development Executive")
        expect(getRoleCountLabel(25)).toBe("Role 25")
    })
})
