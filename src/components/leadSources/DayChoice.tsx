import clsx from "clsx"
import { Pressable, Text, View } from "react-native"

import DateField from "@/components/list/DateField"
import { addDays, todayString } from "@/lib/leadSourceDay"

interface Props {
    /** "YYYY-MM-DD" in the person's own time zone, or null for no day. */
    value: string | null
    onChange: (day: string | null) => void
    allowNone?: boolean
    noneLabel?: string
}

// How far ahead a day can be set: the web's max={addDays(today, 366)}.
const MAX_DAYS_AHEAD = 366

/**
 * Picks the day to call on: no day, today, tomorrow, or any later date up to a year ahead. Ported from the web's
 * DayChoice.tsx; the "Other day" box is the list kit's DateField.
 */
export default function DayChoice({ value, onChange, allowNone = true, noneLabel = "No day" }: Props) {
    const today = todayString()
    const tomorrow = addDays(today, 1)
    const isCustom = value !== null && value !== today && value !== tomorrow

    const choices: { label: string; day: string | null }[] = [
        ...(allowNone ? [{ label: noneLabel, day: null }] : []),
        { label: "Today", day: today },
        { label: "Tomorrow", day: tomorrow },
    ]

    return (
        <View className="gap-3">
            <View className="flex-row flex-wrap gap-1.5" accessibilityRole="radiogroup" accessibilityLabel="Day">
                {choices.map((choice) => {
                    const isActive = value === choice.day
                    return (
                        <Pressable
                            key={choice.label}
                            onPress={() => onChange(choice.day)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isActive }}
                            className={clsx(
                                "min-h-[44px] justify-center rounded-lg border px-3",
                                isActive
                                    ? "border-blue-600 bg-blue-600"
                                    : "border-slate-300 active:bg-slate-50 dark:border-neutral-700 dark:active:bg-neutral-800",
                            )}
                        >
                            <Text
                                className={clsx(
                                    "text-sm font-medium",
                                    isActive ? "text-white" : "text-neutral-700 dark:text-neutral-200",
                                )}
                            >
                                {choice.label}
                            </Text>
                        </Pressable>
                    )
                })}
            </View>
            <DateField
                label="Other day"
                value={isCustom && value ? value : addDays(today, 2)}
                min={today}
                max={addDays(today, MAX_DAYS_AHEAD)}
                active={isCustom}
                onChange={(day) => day && onChange(day)}
            />
        </View>
    )
}
