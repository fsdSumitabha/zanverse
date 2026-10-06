import { useNavigation } from "@react-navigation/native"
import { Pressable, Text, View } from "react-native"

import { INTERACTION_TYPE, INTERACTION_TYPE_META, type InteractionType } from "@/constants/interactionTypes"
import { toNativeClasses } from "@/lib/nativeClasses"
import type { RootStackParamList } from "@/navigation/types"

interface Props {
    entityType: number
    entityId: string
}

type FormRoute = "LogCall" | "ScheduleMeeting" | "AddNote" | "SendQuotation"

// The web's order, and the form each opens.
const ACTIONS: { type: InteractionType; route: FormRoute }[] = [
    { type: INTERACTION_TYPE.CALL_MADE, route: "LogCall" },
    { type: INTERACTION_TYPE.MEETING_SCHEDULED, route: "ScheduleMeeting" },
    { type: INTERACTION_TYPE.NOTE_ADDED, route: "AddNote" },
    { type: INTERACTION_TYPE.QUOTATION_SENT, route: "SendQuotation" },
]

const BUTTON_BASE = "min-h-[44px] justify-center rounded-md px-3 py-1 text-sm font-medium"

/**
 * The four "+ add" buttons above a timeline, coloured by INTERACTION_TYPE_META. Ported from the web's
 * LeadInteractionActions.tsx. Each opens its form as a modal screen; the timeline reloads when the screen returns.
 */
export default function InteractionActions({ entityType, entityId }: Props) {
    const navigation = useNavigation()

    function open(route: keyof Pick<RootStackParamList, FormRoute>) {
        navigation.navigate(route, { entityType, entityId })
    }

    return (
        <View className="flex-row flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:rounded-xl dark:border-neutral-700 dark:bg-neutral-900">
            {ACTIONS.map(({ type, route }) => {
                const meta = INTERACTION_TYPE_META[type]
                const classes = toNativeClasses(`${BUTTON_BASE} ${meta.color}`)
                return (
                    <Pressable
                        key={type}
                        onPress={() => open(route)}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${meta.label}`}
                        className={`${classes.container} opacity-80 active:opacity-100`}
                    >
                        <Text className={classes.text}>+ {meta.label}</Text>
                    </Pressable>
                )
            })}
        </View>
    )
}
