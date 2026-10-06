import DateTimePicker from "@react-native-community/datetimepicker"
import clsx from "clsx"
import { AlarmClock, CalendarClock } from "lucide-react-native"
import { useState } from "react"
import { Platform, Pressable, Text, View } from "react-native"

import { useNow } from "@/hooks/useNow"
import { CALLBACK_PRESETS, formatCallback, relativeCallback, toDateTimeLocal } from "@/lib/callback"
import { enableIconClassNames } from "@/lib/iconClassName"
import { pickDateTimeAndroid } from "@/lib/pickDateTime"

export interface CallbackChoice {
    /** Index into CALLBACK_PRESETS, or null. */
    preset: number | null
    /** The exact time, "YYYY-MM-DDTHH:mm" local, or "". */
    custom: string
}

export const EMPTY_CHOICE: CallbackChoice = { preset: null, custom: "" }

/** The moment a choice points at. Presets are worked out from now. Verbatim from the web. */
export function resolveChoice(choice: CallbackChoice): Date | null {
    if (choice.preset !== null) return CALLBACK_PRESETS[choice.preset].at()
    if (choice.custom) {
        const date = new Date(choice.custom)
        return Number.isNaN(date.getTime()) ? null : date
    }
    return null
}

interface Props {
    value: CallbackChoice
    onChange: (next: CallbackChoice) => void
}

const PILL = "min-h-[36px] justify-center rounded-full border px-3 py-1"

enableIconClassNames(AlarmClock, CalendarClock)

/**
 * Quick callback times, plus an exact time. Ported from the web's CallbackPicker.tsx: "call me after 2 hours" is one
 * tap, "call me at 12" is the date and time dialogs.
 */
export default function CallbackPicker({ value, onChange }: Props) {
    // Its own clock, so "in 25 min" stays true while the sheet is open.
    const now = useNow(15_000)
    const at = resolveChoice(value)
    const [isIosPickerOpen, setIsIosPickerOpen] = useState(false)

    function setExact(date: Date) {
        onChange({ preset: null, custom: toDateTimeLocal(date) })
    }

    function openExact() {
        if (Platform.OS === "android") {
            pickDateTimeAndroid({ value: at ?? new Date(now), minimumDate: new Date(now), onPicked: setExact })
            return
        }
        setIsIosPickerOpen((open) => !open)
    }

    return (
        <View className="gap-2">
            <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-300">Call back in</Text>

            <View className="flex-row flex-wrap gap-1.5">
                {CALLBACK_PRESETS.map((preset, index) => {
                    const isActive = value.preset === index
                    return (
                        <Pressable
                            key={preset.label}
                            onPress={() => onChange({ preset: index, custom: "" })}
                            hitSlop={4}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                            className={clsx(
                                PILL,
                                isActive
                                    ? "border-violet-600 bg-violet-600"
                                    : "border-slate-300 dark:border-neutral-700",
                            )}
                        >
                            <Text
                                className={clsx(
                                    "text-xs font-medium",
                                    isActive ? "text-white" : "text-neutral-700 dark:text-neutral-200",
                                )}
                            >
                                {preset.label}
                            </Text>
                        </Pressable>
                    )
                })}
            </View>

            <View className="flex-row items-center gap-2">
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">or at</Text>
                <Pressable
                    onPress={openExact}
                    accessibilityRole="button"
                    accessibilityLabel="Pick an exact time"
                    className={clsx(
                        "min-h-[36px] flex-1 flex-row items-center gap-2 rounded-md border px-2 py-1",
                        value.custom ? "border-violet-600" : "border-slate-300 dark:border-neutral-700",
                    )}
                >
                    <CalendarClock size={14} className="text-neutral-500 dark:text-neutral-400" />
                    <Text className="text-xs text-neutral-800 dark:text-neutral-100">
                        {value.custom && at ? formatCallback(at.toISOString()) : "Pick a day and time"}
                    </Text>
                </Pressable>
            </View>

            {Platform.OS === "ios" && isIosPickerOpen && (
                <DateTimePicker
                    mode="datetime"
                    display="inline"
                    value={at ?? new Date(now)}
                    minimumDate={new Date(now)}
                    onChange={(_event, date) => date && setExact(date)}
                />
            )}

            {at && (
                <View className="flex-row flex-wrap items-center gap-1.5">
                    <AlarmClock size={14} className="text-violet-700 dark:text-violet-300" />
                    <Text className="text-xs font-medium text-violet-700 dark:text-violet-300">
                        {formatCallback(at.toISOString())}
                    </Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        ({relativeCallback(at.toISOString(), now)})
                    </Text>
                </View>
            )}
        </View>
    )
}
