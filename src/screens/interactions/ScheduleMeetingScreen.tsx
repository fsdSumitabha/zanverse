import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Users } from "lucide-react-native"
import { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"

import { send } from "@/api/client"
import FormActions from "@/components/interactions/FormActions"
import {
    DateTimeField,
    Field,
    FIELD_BOX_CLASSES,
    FormScrollView,
    Input,
    SelectSheet,
    Textarea,
    type SelectOption,
} from "@/components/ui"
import { MEETING_STATUS } from "@/constants/meetingStatus"
import { MEETING_TYPE, MEETING_TYPE_META, type MeetingType } from "@/constants/meetingTypes"
import { enableIconClassNames } from "@/lib/iconClassName"
import { toastPromise } from "@/lib/toastPromise"
import type { AttendeeOption, RootStackParamList } from "@/navigation/types"

type Navigation = NativeStackNavigationProp<RootStackParamList, "ScheduleMeeting">

const MEETING_TYPE_OPTIONS: SelectOption<MeetingType>[] = (
    Object.entries(MEETING_TYPE_META) as [string, { label: string }][]
).map(([value, meta]) => ({ label: meta.label, value: Number(value) as MeetingType }))

enableIconClassNames(Users)

function getErrorText(error: unknown): string {
    return error instanceof Error ? error.message || "Something went wrong" : "Something went wrong"
}

/**
 * Schedules a meeting with attendees. Ported from the web's MeetingForm.tsx. The attendee list opens as its own
 * screen, which returns the selection here.
 */
export default function ScheduleMeetingScreen() {
    const navigation = useNavigation<Navigation>()
    const { params } = useRoute<RouteProp<RootStackParamList, "ScheduleMeeting">>()
    const { entityType, entityId } = params
    const [title, setTitle] = useState("")
    const [agenda, setAgenda] = useState("")
    const [description, setDescription] = useState("")
    const [date, setDate] = useState<Date | null>(null)
    const [meetingType, setMeetingType] = useState<MeetingType>(MEETING_TYPE.ONLINE)
    const [attendees, setAttendees] = useState<AttendeeOption[]>([])
    const [loading, setLoading] = useState(false)

    // The picker returns its selection as a route param.
    useEffect(() => {
        if (params.attendees) setAttendees(params.attendees)
    }, [params.attendees])

    async function handleSubmit() {
        setLoading(true)
        const promise = send("/api/admin/operations/meetings", "POST", {
            entityType,
            entityId,
            title,
            agenda,
            description,
            meetingType,
            status: MEETING_STATUS.SCHEDULED,
            scheduledAt: date ? date.toISOString() : "",
            attendees: attendees.map((attendee) => attendee._id),
        })
        toastPromise(promise, {
            loading: "Scheduling meeting...",
            success: "Meeting scheduled successfully",
            error: getErrorText,
        })

        try {
            await promise
            navigation.goBack()
        } catch {
            // The toast already shows the error.
        } finally {
            setLoading(false)
        }
    }

    return (
        <FormScrollView>
            <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Discovery Call" />
            <Input label="Agenda" value={agenda} onChangeText={setAgenda} placeholder="Purpose of the meeting" />
            <Textarea label="Description" value={description} onChangeText={setDescription} numberOfLines={3} />
            <DateTimeField label="Meeting Date & Time" value={date} onChange={setDate} minimumDate={new Date()} />
            <SelectSheet
                label="Meeting Type"
                options={MEETING_TYPE_OPTIONS}
                value={meetingType}
                onChange={setMeetingType}
            />

            <Field label="Attendees">
                <Pressable
                    onPress={() => navigation.navigate("AttendeePicker", { selected: attendees })}
                    accessibilityRole="button"
                    accessibilityLabel={`Attendees, ${attendees.length} selected`}
                    className={`${FIELD_BOX_CLASSES} flex-row items-center gap-2`}
                >
                    <Users size={16} className="text-neutral-400" />
                    <Text numberOfLines={2} className="flex-1 text-sm text-neutral-800 dark:text-neutral-100">
                        {attendees.length > 0
                            ? attendees.map((attendee) => attendee.name).join(", ")
                            : "Choose attendees"}
                    </Text>
                    <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                            {attendees.length} selected
                        </Text>
                    </View>
                </Pressable>
            </Field>

            <FormActions
                saveLabel="Schedule"
                savingLabel="Saving..."
                isSaving={loading}
                onSave={handleSubmit}
                onCancel={() => navigation.goBack()}
            />
        </FormScrollView>
    )
}
