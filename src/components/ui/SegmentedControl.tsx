import clsx from "clsx"
import { Pressable, Text, View } from "react-native"

export interface Segment<T extends string> {
    label: string
    value: T
}

interface Props<T extends string> {
    segments: Segment<T>[]
    value: T
    onChange: (value: T) => void
}

const SELECTED_SHADOW = { elevation: 1 }

/** A row of equal buttons, one selected, for switching between sections of one screen. */
export default function SegmentedControl<T extends string>({ segments, value, onChange }: Props<T>) {
    return (
        <View accessibilityRole="tablist" className="flex-row rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            {segments.map((segment) => {
                const isSelected = segment.value === value
                return (
                    <Pressable
                        key={segment.value}
                        onPress={() => onChange(segment.value)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        className={clsx(
                            "min-h-[40px] flex-1 items-center justify-center rounded-md",
                            isSelected && "bg-white dark:bg-neutral-900",
                        )}
                        style={isSelected ? SELECTED_SHADOW : undefined}
                    >
                        <Text
                            className={clsx(
                                "text-sm",
                                isSelected
                                    ? "font-semibold text-neutral-900 dark:text-neutral-100"
                                    : "text-neutral-500 dark:text-neutral-400",
                            )}
                        >
                            {segment.label}
                        </Text>
                    </Pressable>
                )
            })}
        </View>
    )
}
