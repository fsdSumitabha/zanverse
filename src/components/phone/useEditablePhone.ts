import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js"
import { useEffect, useRef, useState, type ComponentRef } from "react"
import type { TextInput } from "react-native"

import { useRegion } from "@/contexts/RegionContext"
import { toE164, validateLocalPhone } from "@/lib/phone"

// Phone state for a create or edit form. Spread `phone.fieldProps` on
// <PhoneField>. Ported from the web's useEditablePhone.ts.
//
// `savedPhone` is the value in the database. It may be an old format such
// as "9876543210" or even "N/A". If the user does not change the number,
// check() returns `savedPhone` exactly, so the server sees no change and
// editing other fields never fails on an old value. If the user changes the
// number, check() validates it and returns E.164.
//
// check() reads the text shown in the box, with the country from the
// picker. The web reads it from the <input> element; here the typed text is
// kept in state, with a ref so check() always sees the latest keystroke.

/** A valid saved number as the box shows it: the national format, without the country code. */
function getNationalText(e164: string | undefined): string {
    if (!e164) return ""
    return parsePhoneNumberFromString(e164)?.formatNational() ?? ""
}

export function useEditablePhone(savedPhone: string = "") {
    const { phoneCountry } = useRegion()
    const savedE164 = toE164(savedPhone, phoneCountry) ?? undefined
    const savedCountry = (savedE164 && parsePhoneNumberFromString(savedE164)?.country) || phoneCountry

    const [text, setText] = useState(() => getNationalText(savedE164))
    const textRef = useRef(text)
    const [country, setCountry] = useState<CountryCode>(savedCountry)
    const [error, setError] = useState("")
    const inputRef = useRef<ComponentRef<typeof TextInput>>(null)

    function updateText(next: string) {
        textRef.current = next
        setText(next)
    }

    // The saved value arrives after the edit screen loads it.
    useEffect(() => {
        updateText(getNationalText(savedE164))
        setCountry(savedCountry)
        setError("")
        // savedCountry follows savedE164.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedE164, savedPhone])

    function onChangeText(next: string) {
        updateText(next)
        if (error) setError("")
    }

    function onCountryChange(next: CountryCode | undefined) {
        setCountry(next ?? phoneCountry)
        if (error) setError("")
    }

    function showError(message: string, focus: boolean) {
        setError(message)
        if (focus) inputRef.current?.focus()
    }

    // Returns the value to send, or null and shows the error.
    // Pass focus: true on submit, so the user sees the error on a long form.
    function check({ focus = false }: { focus?: boolean } = {}): string | null {
        const typed = textRef.current

        // An invalid old value stays until the user types a new number.
        if (savedPhone && !savedE164 && !typed.trim()) return savedPhone

        const result = validateLocalPhone(typed, country)
        if (!result.ok) {
            showError(result.message, focus)
            return null
        }
        // Same number as saved: send the saved text, so an old format stays.
        if (savedPhone && result.e164 === savedE164) return savedPhone
        return result.e164
    }

    function onBlur() {
        if (textRef.current.trim()) check()
    }

    function reset() {
        updateText(getNationalText(savedE164))
        setError("")
    }

    return {
        check,
        error,
        setError,
        reset,
        // Set when the saved value is not a valid number and the field is empty.
        savedInvalid: savedPhone && !savedE164 && !text ? savedPhone : "",
        fieldProps: {
            value: text,
            onChangeText,
            onBlur,
            onCountryChange,
            onInputError: (message: string) => showError(message, false),
            country,
            inputRef,
            hasError: !!error,
        },
    }
}

export type EditablePhone = ReturnType<typeof useEditablePhone>
