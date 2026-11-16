import clsx from "clsx"
import { AlarmClock, AlarmClockPlus } from "lucide-react-native"
import { Pressable, Text } from "react-native"

import { callbackState, formatCallback, relativeCallback } from "@/lib/callback"
import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"

import { CALLBACK_TONES } from "./rowLayout"

interface Props {
    callbackAt: string | null
    now: number
    onPress: () => void
}

enableIconClassNames(AlarmClock, AlarmClockPlus)

/**
 * The callback on the details screen, full width: the time and how far off it is, in the row chip's colours, or a
 * dashed "Set callback". Ported from the web's CallbackMenu with `variant="button"`. It opens CallbackSheet.
 */
export default function CallbackButton({ callbackAt, now, onPress }: Props) {
    if (!callbackAt) {
        return (
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                className="min-h-[44px] flex-row items-center justify-center gap-1.5 rounded-full border border-dashed border-violet-300 px-3 active:bg-violet-50 dark:border-violet-500/40 dark:active:bg-violet-500/10"
            >
                <AlarmClockPlus size={16} className="text-violet-700 dark:text-violet-300" />
                <Text className="text-sm font-medium text-violet-700 dark:text-violet-300">Set callback</Text>
            </Pressable>
        )
    }

    const state = callbackState(callbackAt, now)
    const tone = toNativeClasses(`rounded-full border px-3 py-1 text-sm font-semibold ${CALLBACK_TONES[state]}`)
    const relative = relativeCallback(callbackAt, now)

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Callback ${formatCallback(callbackAt)}, ${relative}`}
            className={clsx("min-h-[44px] flex-row items-center justify-center gap-1", tone.container)}
        >
            <AlarmClock size={16} className={tone.text} />
            <Text className={tone.text}>{formatCallback(callbackAt)}</Text>
            <Text className={clsx(tone.text, "font-normal opacity-80")}>· {relative}</Text>
        </Pressable>
    )
}
