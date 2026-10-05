import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import clsx from "clsx"
import { CalendarClock } from "lucide-react-native"
import { useState } from "react"
import { Platform, Pressable, Text, View } from "react-native"

import { formatDateTime } from "@/lib/format"
import { enableIconClassNames } from "@/lib/iconClassName"
import { PALETTE } from "@/theme"

import Button from "./Button"
import Field, { FIELD_BOX_CLASSES } from "./Field"
import Sheet from "./Sheet"

interface Props {
    label: string
    value: Date | null
    onChange: (value: Date) => void
    required?: boolean
    placeholder?: string
    error?: string | null
    minimumDate?: Date
}

enableIconClassNames(CalendarClock)

/** The day from `day` with the hour and minute from `time`. */
function combine(day: Date, time: Date): Date {
    const result = new Date(day)
    result.setHours(time.getHours(), time.getMinutes(), 0, 0)
    return result
}

/**
 * A date and time, replacing the web's `datetime-local` input. Android asks for the day, then the time, in its two
 * system dialogs; iOS shows the inline calendar with the time in a sheet. The value is a Date; forms send it as ISO.
 */
export default function DateTimeField({
    label,
    value,
    onChange,
    required = false,
    placeholder = "Pick a date and time",
    error,
    minimumDate,
}: Props) {
    const [isIosOpen, setIsIosOpen] = useState(false)
    const [iosDraft, setIosDraft] = useState<Date>(value ?? new Date())

    function openAndroid() {
        const start = value ?? new Date()
        DateTimePickerAndroid.open({
            value: start,
            mode: "date",
            minimumDate,
            onChange: (event: DateTimePickerEvent, day?: Date) => {
                if (event.type !== "set" || !day) return
                DateTimePickerAndroid.open({
                    value: start,
                    mode: "time",
                    onChange: (timeEvent: DateTimePickerEvent, time?: Date) => {
                        if (timeEvent.type === "set" && time) onChange(combine(day, time))
                    },
                })
            },
        })
    }

    function open() {
        if (Platform.OS === "android") return openAndroid()
        setIosDraft(value ?? new Date())
        setIsIosOpen(true)
    }

    return (
        <Field label={label} required={required} error={error}>
            <Pressable
                onPress={open}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${value ? formatDateTime(value) : placeholder}`}
                className={clsx(FIELD_BOX_CLASSES, "flex-row items-center gap-2")}
                style={error ? { borderColor: PALETTE["red-500"] } : undefined}
            >
                <CalendarClock size={16} className="text-neutral-400" />
                <Text
                    className={clsx(
                        "flex-1 text-sm",
                        value ? "text-neutral-800 dark:text-neutral-100" : "text-neutral-400",
                    )}
                >
                    {value ? formatDateTime(value) : placeholder}
                </Text>
            </Pressable>

            {Platform.OS === "ios" && (
                <Sheet visible={isIosOpen} onClose={() => setIsIosOpen(false)} accessibilityLabel={label}>
                    <View className="gap-3 px-5 pb-4 pt-3">
                        <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{label}</Text>
                        <DateTimePicker
                            mode="datetime"
                            display="inline"
                            value={iosDraft}
                            minimumDate={minimumDate}
                            onChange={(_event, date) => date && setIosDraft(date)}
                        />
                        <Button
                            label="Done"
                            onPress={() => {
                                setIsIosOpen(false)
                                onChange(iosDraft)
                            }}
                        />
                    </View>
                </Sheet>
            )}
        </Field>
    )
}
