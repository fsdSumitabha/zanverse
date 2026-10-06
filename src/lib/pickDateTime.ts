import { DateTimePickerAndroid, type DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { Platform } from "react-native"

/**
 * True where the system has its own date and time dialogs (Android). Elsewhere (iOS) a picker draws inline. The one
 * place screens and components learn which platform they are on, so they stay free of Platform checks.
 */
export function hasSystemDateDialogs(): boolean {
    return Platform.OS === "android"
}

interface Options {
    /** Where the dialogs start. */
    value: Date
    minimumDate?: Date
    maximumDate?: Date
    onPicked: (value: Date) => void
}

/** The day from `day` with the hour and minute from `time`. */
export function combineDayAndTime(day: Date, time: Date): Date {
    const result = new Date(day)
    result.setHours(time.getHours(), time.getMinutes(), 0, 0)
    return result
}

/**
 * Android's two system dialogs, one after the other: the day, then the time. Cancelling either picks nothing. iOS has
 * no such dialogs; callers show the inline picker there.
 */
export function pickDateTimeAndroid({ value, minimumDate, onPicked }: Options): void {
    DateTimePickerAndroid.open({
        value,
        mode: "date",
        minimumDate,
        onChange: (event: DateTimePickerEvent, day?: Date) => {
            if (event.type !== "set" || !day) return
            DateTimePickerAndroid.open({
                value,
                mode: "time",
                onChange: (timeEvent: DateTimePickerEvent, time?: Date) => {
                    if (timeEvent.type === "set" && time) onPicked(combineDayAndTime(day, time))
                },
            })
        },
    })
}

/** Android's day dialog alone. Cancelling it picks nothing. */
export function pickDateAndroid({ value, minimumDate, maximumDate, onPicked }: Options): void {
    DateTimePickerAndroid.open({
        value,
        mode: "date",
        minimumDate,
        maximumDate,
        onChange: (event: DateTimePickerEvent, day?: Date) => {
            if (event.type === "set" && day) onPicked(day)
        },
    })
}
