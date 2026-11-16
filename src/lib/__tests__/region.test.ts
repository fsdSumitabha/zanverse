import * as regionModule from "@/lib/region"
import {
    ALL_REGIONS,
    ALL_REGIONS_META,
    DEFAULT_REGION,
    REGIONS,
    REGION_CODES,
    parseRegionCode,
    resolveEffectiveRegion,
} from "@/lib/region"

describe("resolveEffectiveRegion", () => {
    test("the all-regions view falls back to India, the default region", () => {
        expect(resolveEffectiveRegion(ALL_REGIONS).label).toBe("India")
        expect(resolveEffectiveRegion(ALL_REGIONS)).toEqual({ code: "IN", label: "India", phoneCountry: "IN" })
    })

    test("a single region resolves to itself", () => {
        expect(resolveEffectiveRegion("US")).toBe(REGIONS.US)
        expect(resolveEffectiveRegion("AE").label).toBe("United Arab Emirates")
    })
})

describe("parseRegionCode", () => {
    test("is case-insensitive and trims", () => {
        expect(parseRegionCode("us")).toBe("US")
        expect(parseRegionCode(" ae ")).toBe("AE")
        expect(parseRegionCode("IN")).toBe("IN")
    })

    test("an unknown, empty or non-text value falls back to IN", () => {
        expect(parseRegionCode("XX")).toBe("IN")
        expect(parseRegionCode("")).toBe("IN")
        expect(parseRegionCode(undefined)).toBe("IN")
        expect(parseRegionCode(42)).toBe("IN")
    })
})

describe("region table", () => {
    test("three regions, each keyed by its own code with a phone country", () => {
        expect(REGION_CODES).toEqual(["IN", "US", "AE"])
        for (const code of REGION_CODES) {
            expect(REGIONS[code].code).toBe(code)
            expect(REGIONS[code].phoneCountry).toBe(code)
        }
        expect(DEFAULT_REGION).toBe("IN")
    })

    test("the all-regions value is view-only: it is not a region code", () => {
        expect(ALL_REGIONS).toBe("ALL")
        expect((REGION_CODES as readonly string[]).includes(ALL_REGIONS)).toBe(false)
        expect(ALL_REGIONS_META).toEqual({ code: "ALL", label: "Planet" })
    })

    test("getRegion() is left out: the app has no NEXT_PUBLIC_REGION, session 4 supplies the region", () => {
        expect("getRegion" in regionModule).toBe(false)
    })
})
