import {
    PHONE_MESSAGES,
    checkPastedPhone,
    formatPhoneForDisplay,
    getPhonePlaceholder,
    phoneLookupCondition,
    toE164,
    toWhatsAppNumber,
    validateLocalPhone,
    validatePhone,
} from "@/lib/phone"

function expectError(result: ReturnType<typeof validatePhone>, code: keyof typeof PHONE_MESSAGES) {
    expect(result).toEqual({ ok: false, code, message: PHONE_MESSAGES[code] })
}

describe("validatePhone", () => {
    test("an extension is refused with HAS_EXTENSION", () => {
        expectError(validatePhone("+1 415 555 0146 ext. 12", "US"), "HAS_EXTENSION")
        expectError(validatePhone("415-555-0146 x123", "US"), "HAS_EXTENSION")
    })

    test("text around a number is NOT_A_NUMBER, not a number with the letters dropped", () => {
        expectError(validatePhone("Call after 6pm: 415 555 0146", "US"), "NOT_A_NUMBER")
    })

    test("two numbers in one cell, separated by a comma, are NOT_A_NUMBER", () => {
        expectError(validatePhone("415 555 0146, 415 555 0181", "US"), "NOT_A_NUMBER")
        expectError(validatePhone("98765 43210, 91234 56780", "IN"), "NOT_A_NUMBER")
    })

    test("two numbers joined by a slash or a space read as one long number (web behaviour, copied as is)", () => {
        expectError(validatePhone("9876543210 / 9123456780", "IN"), "TOO_LONG")
        expectError(validatePhone("9876543210 9123456780", "IN"), "TOO_LONG")
    })

    test("zero-width and text-direction marks from a contacts app are ignored", () => {
        const expected = { ok: true, e164: "+14155550146" }
        expect(validatePhone("​+1 415 555 0146​", "US")).toEqual(expected) // zero-width space
        expect(validatePhone("‎+1 415 555 0146‏", "US")).toEqual(expected) // LRM, RLM
        expect(validatePhone("‪+1 415 555 0146‬", "US")).toEqual(expected) // LRE, PDF
        expect(validatePhone("⁦+1 415 555 0146⁩", "US")).toEqual(expected) // LRI, PDI
        expect(validatePhone("﻿+1 415 555 0146", "US")).toEqual(expected) // BOM
        expect(validatePhone("​98765 43210​", "IN")).toEqual({ ok: true, e164: "+919876543210" })
    })

    test("the default country decides how digits without a country code are read", () => {
        expect(validatePhone("9876543210", "IN")).toEqual({ ok: true, e164: "+919876543210" })
        // With US picked, the same digits are read in the US plan (+1 987 654 3210). 987 is not a US area code,
        // so the number is refused for the selected country. It is never saved as the Indian +91 number.
        expectError(validatePhone("9876543210", "US"), "INVALID")
        expect(toE164("9876543210", "US")).toBeNull()
        expect(validatePhone("2015550123", "US")).toEqual({ ok: true, e164: "+12015550123" })
    })

    test("a full international number is accepted whatever the default country", () => {
        expect(validatePhone("+91 98765 43210", "US")).toEqual({ ok: true, e164: "+919876543210" })
    })

    test("a leading 00 is read as the international prefix", () => {
        expect(validatePhone("00 91 98765 43210", "IN")).toEqual({ ok: true, e164: "+919876543210" })
    })

    test("empty, blank or non-text input is REQUIRED", () => {
        expectError(validatePhone("", "IN"), "REQUIRED")
        expectError(validatePhone("   ", "IN"), "REQUIRED")
        expectError(validatePhone(undefined, "IN"), "REQUIRED")
        expectError(validatePhone(9876543210, "IN"), "REQUIRED")
    })

    test("length errors come before INVALID", () => {
        expectError(validatePhone("12345", "IN"), "TOO_SHORT")
        expectError(validatePhone("98765432101234", "IN"), "TOO_LONG")
        expectError(validatePhone("1".repeat(41), "IN"), "TOO_LONG")
    })

    test("digits that are not a real number are INVALID", () => {
        expectError(validatePhone("0000000000", "IN"), "INVALID")
    })
})

describe("validateLocalPhone", () => {
    test("a typed country code is refused with HAS_COUNTRY_CODE", () => {
        expectError(validateLocalPhone("+44 20 7946 0958", "US"), "HAS_COUNTRY_CODE")
        expectError(validateLocalPhone("​+91 98765 43210", "IN"), "HAS_COUNTRY_CODE")
    })

    test("a number dialled into another country is refused with OTHER_COUNTRY", () => {
        expectError(validateLocalPhone("011 44 20 7946 0958", "US"), "OTHER_COUNTRY")
        expectError(validateLocalPhone("00 44 20 7946 0958", "IN"), "OTHER_COUNTRY")
    })

    test("a local number, or the picked country's own dialling prefix, is accepted", () => {
        expect(validateLocalPhone("98765 43210", "IN")).toEqual({ ok: true, e164: "+919876543210" })
        expect(validateLocalPhone("001 415 555 0146", "US")).toEqual({ ok: true, e164: "+14155550146" })
    })

    test("other errors pass through from validatePhone", () => {
        expectError(validateLocalPhone("", "IN"), "REQUIRED")
        expectError(validateLocalPhone("12345", "IN"), "TOO_SHORT")
    })
})

describe("checkPastedPhone", () => {
    test("allow: digits with spaces and ( ) . -, in any script", () => {
        expect(checkPastedPhone("(415) 555-0146", "US")).toEqual({ action: "allow" })
        expect(checkPastedPhone("415.555.0146", "US")).toEqual({ action: "allow" })
        expect(checkPastedPhone("４１５ ５５５ ０１４６", "US")).toEqual({ action: "allow" })
        expect(checkPastedPhone("٩٨٧٦٥٤٣٢١٠", "IN")).toEqual({ action: "allow" })
        expect(checkPastedPhone("   ", "US")).toEqual({ action: "allow" })
    })

    test("replace: a full number for the picked country", () => {
        expect(checkPastedPhone("+1 415 555 0123", "US")).toEqual({ action: "replace", e164: "+14155550123" })
        expect(checkPastedPhone("​+91 98765 43210", "IN")).toEqual({ action: "replace", e164: "+919876543210" })
    })

    test("reject: another country's number", () => {
        expect(checkPastedPhone("+44 20 7946 0958", "US")).toEqual({
            action: "reject",
            message: PHONE_MESSAGES.OTHER_COUNTRY,
        })
    })

    test("reject: an invalid full number, with the reason", () => {
        expect(checkPastedPhone("+1 23", "US")).toEqual({ action: "reject", message: PHONE_MESSAGES.TOO_SHORT })
    })

    test("reject: letters, even when a valid number is inside", () => {
        const notANumber = { action: "reject", message: PHONE_MESSAGES.NOT_A_NUMBER }
        expect(checkPastedPhone("Call after 6pm: 415 555 0146", "US")).toEqual(notANumber)
        expect(checkPastedPhone("tel 415 555 0146", "US")).toEqual(notANumber)
    })
})

describe("phoneLookupCondition", () => {
    function matches(e164: string, country: "US" | "IN", stored: string): boolean {
        return new RegExp(phoneLookupCondition(e164, country).$regex).test(stored)
    }

    test("matches every saved form of a number from the region's own country", () => {
        for (const stored of [
            "4155550181",
            "(415) 555-0181",
            "001 415 555 0181",
            "+14155550181",
            "14155550181",
            "+1 415-555-0181",
            "011 1 415 555 0181",
        ]) {
            expect([stored, matches("+14155550181", "US", stored)]).toEqual([stored, true])
        }
    })

    test("does not match a different number", () => {
        expect(matches("+14155550181", "US", "4155550182")).toBe(false)
        expect(matches("+14155550181", "US", "41555501810")).toBe(false)
    })

    test("for another country's number, the country code is required", () => {
        expect(matches("+14155550181", "IN", "4155550181")).toBe(false)
        expect(matches("+14155550181", "IN", "+1 415 555 0181")).toBe(true)
        expect(matches("+14155550181", "IN", "001 415 555 0181")).toBe(true)
    })

    test("an unparsable value falls back to an exact digit match", () => {
        expect(phoneLookupCondition("garbage-123", "US")).toEqual({ $regex: "^123$" })
    })
})

describe("stored values", () => {
    test("toE164 reads old rows with the default country and refuses extensions", () => {
        expect(toE164("98765 43210", "IN")).toBe("+919876543210")
        expect(toE164("+1 415 555 0146 ext 2", "US")).toBeNull()
        expect(toE164("not a phone", "IN")).toBeNull()
        expect(toE164(null, "IN")).toBeNull()
    })

    test("formatPhoneForDisplay formats valid numbers and returns old text as it was saved", () => {
        expect(formatPhoneForDisplay("9876543210", "IN")).toBe("+91 98765 43210")
        expect(formatPhoneForDisplay("+14155550123", "IN")).toBe("+1 415 555 0123")
        expect(formatPhoneForDisplay("  not a phone  ", "IN")).toBe("not a phone")
        expect(formatPhoneForDisplay(42, "IN")).toBe("")
    })

    test("toWhatsAppNumber gives the digits without the plus", () => {
        expect(toWhatsAppNumber("9876543210", "IN")).toBe("919876543210")
        expect(toWhatsAppNumber("123", "IN")).toBeNull()
    })
})

describe("getPhonePlaceholder", () => {
    test("shows each region's example in the format the input uses while typing", () => {
        expect(getPhonePlaceholder("US")).toBe("(201) 555-0123")
        expect(getPhonePlaceholder("IN")).toBe("81234 56789")
        expect(getPhonePlaceholder("AE")).toBe("050 123 4567")
        expect(getPhonePlaceholder(undefined)).toBe("+1 201 555 0123")
    })
})
