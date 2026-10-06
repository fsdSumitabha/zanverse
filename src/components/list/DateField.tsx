import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import clsx from "clsx"
import { Calendar } from "lucide-react-native"
import { useState } from "react"
import { Platform, Pressable, Text, View } from "react-native"

import { Button, FIELD_BOX_CLASSES, Sheet } from "@/components/ui"
import { formatLocalDate, parseLocalDate } from "@/lib/dates"
import { formatShortDate } from "@/lib/format"
import { enableIconClassNames } from "@/lib/iconClassName"

interface Props {
    label: string
    /** YYYY-MM-DD. */
    value: string
    min?: string
    max?: string
    /** True when the person chose this value. False shows it muted, like a placeholder. */
    active: boolean
    onChange: (value: string) => void
}

// The web DateField's label and text classes.
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-neutral-700 dark:text-neutral-300"
const TEXT_ACTIVE = "text-neutral-900 dark:text-neutral-100"
const TEXT_PLACEHOLDER = "text-neutral-600 dark:text-neutral-500"

enableIconClassNames(Calendar)

/**
 * A date button that opens the platform date picker. Ported from the web's filters/DateField.tsx: same props, same
 * YYYY-MM-DD strings in and out. Android opens its dialog; iOS opens a sheet with the inline calendar.
 */
export default function DateField({ label, value, min, max, active, onChange }: Props) {
    const [isIosSheetOpen, setIsIosSheetOpen] = useState(false)
    const [iosDraft, setIosDraft] = useState(() => parseLocalDate(value))

    const minimumDate = min ? parseLocalDate(min) : undefined
    const maximumDate = max ? parseLocalDate(max) : undefined

    function handleAndroidChange(event: DateTimePickerEvent, date?: Date) {
        if (event.type === "set" && date) onChange(formatLocalDate(date))
    }

    function openPicker() {
        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value: parseLocalDate(value),
                mode: "date",
                minimumDate,
                maximumDate,
                onChange: handleAndroidChange,
            })
            return
        }
        setIosDraft(parseLocalDate(value))
        setIsIosSheetOpen(true)
    }

    function handleIosDone() {
        setIsIosSheetOpen(false)
        onChange(formatLocalDate(iosDraft))
    }

    const textClasses = active ? TEXT_ACTIVE : TEXT_PLACEHOLDER

    return (
        <View className="min-w-0 flex-1 gap-1">
            <Text className={LABEL_CLASSES}>{label}</Text>
            <Pressable
                onPress={openPicker}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${formatShortDate(value)}`}
                className={clsx(FIELD_BOX_CLASSES, "flex-row items-center justify-center gap-1.5")}
            >
                <Calendar size={16} className={textClasses} />
                <Text numberOfLines={1} className={clsx("text-sm", textClasses)}>
                    {formatShortDate(value)}
                </Text>
            </Pressable>

            {Platform.OS === "ios" && (
                <Sheet visible={isIosSheetOpen} onClose={() => setIsIosSheetOpen(false)} accessibilityLabel={label}>
                    <View className="gap-3 px-5 pb-4 pt-3">
                        <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{label}</Text>
                        <DateTimePicker
                            mode="date"
                            display="inline"
                            value={iosDraft}
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                            onChange={(_event, date) => date && setIosDraft(date)}
                        />
                        <Button label="Done" onPress={handleIosDone} />
                    </View>
                </Sheet>
            )}
        </View>
    )
}
