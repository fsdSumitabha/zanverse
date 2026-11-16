import { Pressable, Text, View } from "react-native"

import { TONE, type Tone } from "./statsTones"

interface Props {
    label: string
    total: number
    accent?: string
    accentTone?: Tone
    /** Opens the entity's list. The web's title was a Link. */
    onPressTitle?: () => void
}

/** A status card's top line: the title (a link when it can open a list), the total and the accent. */
export default function StatsCardHeader({ label, total, accent, accentTone, onPressTitle }: Props) {
    const title = <Text className="text-base font-semibold text-neutral-900 dark:text-white">{label}</Text>

    return (
        <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-2">
                {onPressTitle ? (
                    <Pressable
                        onPress={onPressTitle}
                        accessibilityRole="link"
                        accessibilityLabel={`Open ${label}`}
                        hitSlop={8}
                        className="min-h-[44px] justify-center active:opacity-60"
                    >
                        {title}
                    </Pressable>
                ) : (
                    title
                )}
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">{total}</Text>
            </View>
            {!!accent && (
                <Text className={`text-xs font-semibold ${accentTone ? TONE[accentTone].accentText : ""}`}>
                    {accent}
                </Text>
            )}
        </View>
    )
}
