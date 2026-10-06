import { DateTimePickerAndroid, type DateTimePickerEvent } from "@react-native-community/datetimepicker"

interface Options {
    /** Where the dialogs start. */
    value: Date
    minimumDate?: Date
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
