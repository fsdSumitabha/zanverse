import { Phone } from "lucide-react-native"
import { Pressable } from "react-native"

import { useRegion } from "@/contexts/RegionContext"
import { startCall } from "@/lib/dialer"
import { PALETTE } from "@/theme"

interface Props {
    name: string
    phone: string
}

/** The round green call button. Every call goes through `startCall` in src/lib/dialer.ts. */
export default function CallButton({ name, phone }: Props) {
    const { phoneCountry } = useRegion()

    return (
        <Pressable
            onPress={() => startCall({ name, phone }, phoneCountry)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${name}`}
            hitSlop={4}
            className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600 active:bg-emerald-500"
        >
            <Phone size={16} color={PALETTE.white} />
        </Pressable>
    )
}
