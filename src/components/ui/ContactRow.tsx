import { Mail, MessageCircle } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { useRegion } from "@/contexts/RegionContext"
import { openEmail, openWhatsApp } from "@/lib/contact"
import { enableIconClassNames } from "@/lib/iconClassName"
import { formatPhoneForDisplay, toWhatsAppNumber } from "@/lib/phone"

interface Props {
    kind: "phone" | "email"
    value: string | null | undefined
    /** Shown when an email is empty. */
    emptyText?: string
}

enableIconClassNames(Mail, MessageCircle)

/**
 * A tappable phone or email line. A phone is WhatsApp green and opens a chat; an invalid one is grey plain text, as
 * in the web's WhatsAppLink. An email is blue with the Mail icon and opens the mail app.
 */
export default function ContactRow({ kind, value, emptyText = "None" }: Props) {
    const { phoneCountry } = useRegion()

    if (kind === "email") {
        const email = value?.trim()
        if (!email) return <Text className="text-sm text-neutral-400">{emptyText}</Text>
        return (
            <Pressable
                onPress={() => openEmail(email)}
                accessibilityRole="link"
                accessibilityLabel={`Email ${email}`}
                className="min-h-[44px] flex-row items-center gap-1.5 active:opacity-70"
            >
                <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                <Text className="flex-shrink text-sm text-blue-600 dark:text-blue-400">{email}</Text>
            </Pressable>
        )
    }

    // No link for a missing or invalid number. A link would open a chat with the wrong person, or with nobody.
    if (!toWhatsAppNumber(value, phoneCountry)) {
        return (
            <View
                accessible
                accessibilityHint={value ? "This is not a valid phone number" : undefined}
                className="min-h-[44px] flex-row items-center gap-2"
            >
                <MessageCircle size={16} className="text-neutral-400 dark:text-neutral-500" />
                <Text className="flex-shrink text-neutral-400 dark:text-neutral-500">{value?.trim() || "N/A"}</Text>
            </View>
        )
    }

    const text = formatPhoneForDisplay(value, phoneCountry)
    return (
        <Pressable
            onPress={() => openWhatsApp(value, phoneCountry)}
            accessibilityRole="link"
            accessibilityLabel={`WhatsApp ${text}`}
            className="min-h-[44px] flex-row items-center gap-2 active:opacity-70"
        >
            <MessageCircle size={16} className="text-green-500" />
            <Text className="flex-shrink text-green-500">{text}</Text>
        </Pressable>
    )
}
