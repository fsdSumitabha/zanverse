import clsx from "clsx"
import { Phone, PhoneOff } from "lucide-react-native"
import { Pressable, Text } from "react-native"

import { useRegion } from "@/contexts/RegionContext"
import { isCallBlocked, startCall } from "@/lib/dialer"
import { PALETTE } from "@/theme"

interface Props {
    name: string
    phone: string
    /** The source's status. A do-not-call status shows the button grey and disabled. */
    status: number
    /** "sm" is the round button on a row. "md" adds the word "Call", on the details screen. */
    size?: "sm" | "md"
}

/**
 * The green call button. Every call goes through `startCall`, which opens the phone's dialer. For a number that must
 * not be called, the button is grey, shows a crossed-out phone, and does nothing.
 */
export default function CallButton({ name, phone, status, size = "sm" }: Props) {
    const { phoneCountry } = useRegion()
    const isBlocked = isCallBlocked(status)
    const Icon = isBlocked ? PhoneOff : Phone
    const iconColor = isBlocked ? PALETTE["neutral-400"] : PALETTE.white
    const tone = isBlocked ? "bg-neutral-200 dark:bg-neutral-800" : "bg-emerald-600 active:bg-emerald-500"
    const shared = {
        onPress: () => startCall({ name, phone }, phoneCountry),
        disabled: isBlocked,
        accessibilityRole: "button" as const,
        accessibilityLabel: isBlocked ? `Do not call ${name}` : `Call ${name}`,
        accessibilityState: { disabled: isBlocked },
    }

    if (size === "md") {
        return (
            <Pressable
                {...shared}
                className={clsx("h-11 flex-row items-center justify-center gap-1.5 rounded-full px-4", tone)}
            >
                <Icon size={16} color={iconColor} />
                <Text className={clsx("text-sm font-medium", isBlocked ? "text-neutral-500" : "text-white")}>
                    {isBlocked ? "Do not call" : "Call"}
                </Text>
            </Pressable>
        )
    }

    return (
        <Pressable {...shared} hitSlop={4} className={clsx("h-10 w-10 items-center justify-center rounded-full", tone)}>
            <Icon size={16} color={iconColor} />
        </Pressable>
    )
}
