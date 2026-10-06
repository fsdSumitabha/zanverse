import { Pressable, Text, View } from "react-native"

import PhoneText from "@/components/phone/PhoneText"
import { Badge, InlineValue, TimeAgo } from "@/components/ui"
import { LEAD_STATUS, LEAD_STATUS_META } from "@/constants/leadStatus"
import type { Lead } from "@/types/lead"

import ConvertButton from "./ConvertButton"

interface Props {
    lead: Lead
    company?: string
    onPress: () => void
    /** Shown at status 50, when the role may convert. Leave out to hide the button. */
    onConvert?: () => void
}

// The web card's classes, without hover and the my-4 margin (the list spaces the rows).
const CARD_CLASSES =
    "rounded-lg border border-slate-200 bg-white p-4 active:border-blue-500/40 dark:rounded-xl dark:border-neutral-600 dark:bg-neutral-950"

// The web's `shadow`, as Android elevation.
const CARD_SHADOW = {
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
}

/** One lead in the list. Ported from the web's LeadCard.tsx; the "Created by" tooltip becomes a visible line. */
export default function LeadCard({ lead, company, onPress, onConvert }: Props) {
    const isConvertible = lead.status === LEAD_STATUS.NEGOTIATION && !!onConvert

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Lead ${lead.name}`}
            className={CARD_CLASSES}
            style={CARD_SHADOW}
        >
            <View className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="font-semibold text-neutral-900 dark:text-white">
                        {lead.name}
                    </Text>
                    {!!company && (
                        <Text numberOfLines={1} className="text-sm text-neutral-500 dark:text-neutral-400">
                            {company}
                        </Text>
                    )}
                </View>
                <Badge meta={LEAD_STATUS_META} status={lead.status} />
            </View>

            <View className="mt-3 gap-1">
                <PhoneText phone={lead.phone} className="text-sm text-neutral-600 dark:text-neutral-300" />
                {!!lead.email && (
                    <Text numberOfLines={1} className="text-sm text-neutral-600 dark:text-neutral-300">
                        {lead.email}
                    </Text>
                )}
                <View className="flex-row flex-wrap items-center gap-1">
                    <Text numberOfLines={1} className="text-xs text-neutral-500">
                        {lead.source}
                    </Text>
                    <Text className="text-xs text-neutral-500">•</Text>
                    <TimeAgo date={lead.createdAt} className="text-xs" />
                </View>
            </View>

            {isConvertible && (
                <View className="mt-3">
                    <ConvertButton onPress={onConvert} />
                </View>
            )}

            {!!lead.createdBy && (
                <View className="mt-2">
                    <InlineValue value={`Created by ${lead.createdBy.name}`} />
                </View>
            )}
        </Pressable>
    )
}
