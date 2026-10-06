import { MessageCircle } from "lucide-react-native"
import { Linking, Pressable, Text } from "react-native"

import { useRegion } from "@/contexts/RegionContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { formatPhoneForDisplay, toWhatsAppNumber } from "@/lib/phone"

type WhatsAppLinkProps = {
    phone?: string
}

enableIconClassNames(MessageCircle)

/**
 * A phone number that opens a WhatsApp chat. Ported from the web's WhatsAppLink.tsx. A phone has WhatsApp or a
 * browser, so `https://wa.me/<number>` covers both, in place of the web's whatsapp:// and web.whatsapp.com split.
 */
export default function WhatsAppLink({ phone }: WhatsAppLinkProps) {
    const { phoneCountry } = useRegion()
    const number = toWhatsAppNumber(phone, phoneCountry)

    // No link for a missing or invalid number. A link would open a chat
    // with the wrong person, or with nobody.
    if (!number) {
        return (
            <Pressable
                disabled
                accessibilityHint={phone ? "This is not a valid phone number" : undefined}
                className="min-h-[44px] flex-row items-center gap-2"
            >
                <MessageCircle size={16} className="text-neutral-400 dark:text-neutral-500" />
                <Text className="flex-shrink text-neutral-400 dark:text-neutral-500">{phone?.trim() || "N/A"}</Text>
            </Pressable>
        )
    }

    const text = formatPhoneForDisplay(phone, phoneCountry)

    return (
        <Pressable
            onPress={() => Linking.openURL(`https://wa.me/${number}`)}
            accessibilityRole="link"
            accessibilityLabel={`WhatsApp ${text}`}
            className="min-h-[44px] flex-row items-center gap-2 active:opacity-70"
        >
            <MessageCircle size={16} className="text-green-500" />
            <Text className="flex-shrink text-green-500">{text}</Text>
        </Pressable>
    )
}
