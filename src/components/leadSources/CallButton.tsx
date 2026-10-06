import { Phone } from "lucide-react-native"
import { Pressable, Text } from "react-native"

import { useRegion } from "@/contexts/RegionContext"
import { startCall } from "@/lib/dialer"
import { PALETTE } from "@/theme"

interface Props {
    name: string
    phone: string
    /** "sm" is the round button on a row. "md" adds the word "Call", on the details screen. */
    size?: "sm" | "md"
}

/** The green call button. Every call goes through `startCall`, which opens the phone's dialer. */
export default function CallButton({ name, phone, size = "sm" }: Props) {
    const { phoneCountry } = useRegion()

    if (size === "md") {
        return (
            <Pressable
                onPress={() => startCall({ name, phone }, phoneCountry)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${name}`}
                className="h-11 flex-row items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 active:bg-emerald-500"
            >
                <Phone size={16} color={PALETTE.white} />
                <Text className="text-sm font-medium text-white">Call</Text>
            </Pressable>
        )
    }

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
