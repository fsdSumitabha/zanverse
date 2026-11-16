import { CircleCheck } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"

// The web clamps an outcome over 140 characters to three lines.
const LONG_OUTCOME = 140
const CLAMPED_LINES = 3

enableIconClassNames(CircleCheck)

/** The note left when a meeting was marked completed, with Read more past 140 characters. Ported from MeetingCard. */
export default function MeetingOutcome({ text }: { text: string }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const isLong = text.length > LONG_OUTCOME

    return (
        <View className="rounded-md border border-emerald-200 bg-emerald-50/70 p-2.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <View className="mb-1 flex-row items-center gap-1.5">
                <CircleCheck size={12} className="text-emerald-700 dark:text-emerald-300" />
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Outcome
                </Text>
            </View>
            <Text
                numberOfLines={!isExpanded && isLong ? CLAMPED_LINES : undefined}
                className="text-xs text-neutral-700 dark:text-neutral-300"
            >
                {text}
            </Text>
            {isLong && (
                <Pressable onPress={() => setIsExpanded((value) => !value)} accessibilityRole="button" hitSlop={10}>
                    <Text className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        {isExpanded ? "Read less" : "Read more…"}
                    </Text>
                </Pressable>
            )}
        </View>
    )
}
