import clsx from "clsx"
import { Linking, Text } from "react-native"

import { useRegion } from "@/contexts/RegionContext"
import { formatPhoneForDisplay, toE164 } from "@/lib/phone"

// Shows a saved phone number. A valid number is formatted, for example
// "+1 415 555 0123", and can link to tel:. An invalid old value is shown
// as saved, in a muted colour, and is never a link. Ported from the web's PhoneText.tsx.

interface PhoneTextProps {
    phone?: string | null
    link?: boolean
    className?: string
}

export default function PhoneText({ phone, link = false, className }: PhoneTextProps) {
    const { phoneCountry } = useRegion()
    if (!phone?.trim()) return null

    const e164 = toE164(phone, phoneCountry)
    const text = formatPhoneForDisplay(phone, phoneCountry)

    if (!e164) {
        return (
            <Text
                accessibilityHint="This is not a valid phone number"
                className={clsx("text-neutral-400 dark:text-neutral-500", className)}
            >
                {text}
            </Text>
        )
    }

    if (link) {
        return (
            <Text accessibilityRole="link" onPress={() => Linking.openURL(`tel:${e164}`)} className={className}>
                {text}
            </Text>
        )
    }

    return <Text className={className}>{text}</Text>
}
