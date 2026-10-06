import clsx from "clsx"
import { getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js"
import { ChevronDown } from "lucide-react-native"
import { useState, type ComponentRef, type RefObject } from "react"
import { Pressable, Text, TextInput, View } from "react-native"

import { FIELD_CLASSES } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import { PHONE_MESSAGES, checkPastedPhone, getPhonePlaceholder } from "@/lib/phone"
import { PALETTE } from "@/theme"

import CountrySheet from "./CountrySheet"

// Phone input with a country picker. Use it with useEditablePhone():
// <PhoneField {...phone.fieldProps} />. Ported from the web's PhoneField.tsx.
//
// The country code comes only from the picker. The picker shows it, for
// example "+1", and the box takes the local number only.
// - A typed "+" is refused with a message, so the user knows why.
// - Pasted text is checked before the box takes it. A phone has no paste
//   event, so a change of more than one character at once counts as a paste.
//   A pasted full number for the picked country, "+1 415 555 0123", is put in
//   as the local number. Text around a number, or another country's number,
//   is refused.
// - No length limit: an extra digit stays in the box, and the check says
//   "too long".

interface PhoneFieldProps {
    value: string
    onChangeText: (text: string) => void
    onBlur?: () => void
    onCountryChange: (country: CountryCode | undefined) => void
    // Shows a message under the box, such as for a refused paste.
    onInputError: (message: string) => void
    country: CountryCode
    inputRef: RefObject<ComponentRef<typeof TextInput> | null>
    hasError?: boolean
    disabled?: boolean
    accessibilityLabel?: string
}

// The field's box classes without w-full, so the button is only as wide as its text.
const COUNTRY_BUTTON_CLASSES =
    "min-h-[44px] flex-row items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"

enableIconClassNames(ChevronDown)

/** The characters inserted between `prev` and `next`, found by trimming the common start and end. */
function getInsertedText(prev: string, next: string): string {
    let start = 0
    while (start < prev.length && start < next.length && prev[start] === next[start]) start++
    let end = 0
    while (
        end < prev.length - start &&
        end < next.length - start &&
        prev[prev.length - 1 - end] === next[next.length - 1 - end]
    ) {
        end++
    }
    return next.slice(start, next.length - end)
}

function getCallingCode(country: CountryCode): string {
    try {
        return `+${getCountryCallingCode(country)}`
    } catch {
        return ""
    }
}

export default function PhoneField({
    value,
    onChangeText,
    onBlur,
    onCountryChange,
    onInputError,
    country,
    inputRef,
    hasError = false,
    disabled = false,
    accessibilityLabel = "Phone",
}: PhoneFieldProps) {
    const [isCountryOpen, setIsCountryOpen] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    function handleChangeText(next: string) {
        const inserted = getInsertedText(value, next)

        if (inserted.length > 1) {
            const result = checkPastedPhone(inserted, country)
            if (result.action === "reject") return onInputError(result.message)
            if (result.action === "replace") {
                return onChangeText(parsePhoneNumberFromString(result.e164)?.formatNational() ?? next)
            }
            return onChangeText(next)
        }

        if (inserted === "+") return onInputError(PHONE_MESSAGES.HAS_COUNTRY_CODE)
        onChangeText(next)
    }

    const borderColor = hasError ? PALETTE["red-500"] : isFocused ? PALETTE["blue-500"] : undefined

    return (
        <View className="flex-row gap-2">
            <Pressable
                onPress={() => setIsCountryOpen(true)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Country: ${country} ${getCallingCode(country)}`}
                className={clsx(COUNTRY_BUTTON_CLASSES, disabled && "opacity-50")}
            >
                <Text className="text-sm text-neutral-800 dark:text-neutral-100">
                    {country} {getCallingCode(country)}
                </Text>
                <ChevronDown size={14} className="text-neutral-400" />
            </Pressable>
            <View className="flex-1">
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={handleChangeText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false)
                        onBlur?.()
                    }}
                    editable={!disabled}
                    placeholder={getPhonePlaceholder(country)}
                    placeholderTextColor={PALETTE["neutral-400"]}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    accessibilityLabel={accessibilityLabel}
                    accessibilityState={{ disabled }}
                    className={FIELD_CLASSES}
                    style={borderColor ? { borderColor } : undefined}
                />
            </View>
            <CountrySheet
                visible={isCountryOpen}
                value={country}
                onClose={() => setIsCountryOpen(false)}
                onSelect={(next) => {
                    setIsCountryOpen(false)
                    onCountryChange(next)
                }}
            />
        </View>
    )
}
