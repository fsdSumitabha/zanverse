import clsx from "clsx"
import { Pressable, Text, View } from "react-native"

import { INTERACTION_TYPE, INTERACTION_TYPE_META, type InteractionType } from "@/constants/interactionTypes"
import { toNativeClasses } from "@/lib/nativeClasses"

interface Props {
    onAction?: (type: InteractionType) => void
    activeType?: InteractionType | null
}

const ACTION_TYPES: InteractionType[] = [
    INTERACTION_TYPE.CALL_MADE,
    INTERACTION_TYPE.MEETING_SCHEDULED,
    INTERACTION_TYPE.NOTE_ADDED,
    INTERACTION_TYPE.QUOTATION_SENT,
]

const BUTTON_BASE = "min-h-[44px] justify-center rounded-md px-3 py-1 text-sm font-medium"

/**
 * The four "+ add" buttons above the timeline: call, meeting, note, quotation, in the web's order and with the
 * INTERACTION_TYPE_META labels and colours. Ported from the web's LeadInteractionActions.tsx.
 */
export default function LeadInteractionActions({ onAction, activeType }: Props) {
    return (
        <View className="flex-row flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:rounded-xl dark:border-neutral-700 dark:bg-neutral-900">
            {ACTION_TYPES.map((type) => {
                const meta = INTERACTION_TYPE_META[type]
                const isActive = activeType === type
                const classes = toNativeClasses(`${BUTTON_BASE} ${meta.color}`)
                return (
                    <Pressable
                        key={type}
                        onPress={() => onAction?.(type)}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${meta.label}`}
                        className={clsx(
                            classes.container,
                            isActive ? "border-2 border-blue-500" : "opacity-80 active:opacity-100",
                        )}
                    >
                        <Text className={classes.text}>+ {meta.label}</Text>
                    </Pressable>
                )
            })}
        </View>
    )
}
