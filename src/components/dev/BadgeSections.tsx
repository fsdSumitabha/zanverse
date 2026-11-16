import { Text, View } from "react-native"

import { Badge, NotificationBadge, NOTIFICATION_BADGE_NAMES, TemporalBadge, type BadgeMeta } from "@/components/ui"
import { CLIENT_STATUS_META } from "@/constants/clientStatus"
import { LEAD_SOURCE_STATUS_META } from "@/constants/leadSourceStatus"
import { LEAD_STATUS_META } from "@/constants/leadStatus"
import { PROJECT_STATUS_META } from "@/constants/projectStatus"
import { SERVICE_META } from "@/constants/services"

import KitchenSection from "./KitchenSection"

interface MetaMap {
    name: string
    meta: Readonly<Record<number, BadgeMeta | undefined>>
    /** Codes to render that are not in the map, to show the Unknown fallback. */
    missingCodes?: number[]
}

/** The retired lead source status. It must render as a grey Unknown pill. */
const RETIRED_LEAD_SOURCE_STATUS = 60

const META_MAPS: MetaMap[] = [
    { name: "LEAD_STATUS_META", meta: LEAD_STATUS_META },
    { name: "CLIENT_STATUS_META", meta: CLIENT_STATUS_META },
    { name: "PROJECT_STATUS_META", meta: PROJECT_STATUS_META },
    { name: "SERVICE_META", meta: SERVICE_META },
    { name: "LEAD_SOURCE_STATUS_META", meta: LEAD_SOURCE_STATUS_META, missingCodes: [RETIRED_LEAD_SOURCE_STATUS] },
]

// Legacy emoji and an unknown name, to show the fallbacks.
const EXTRA_BADGES = ["📅", "🎉", "not-a-badge"]

function getCodes({ meta, missingCodes = [] }: MetaMap): number[] {
    return [...Object.keys(meta).map(Number), ...missingCodes]
}

/** Badge from all five META maps, TemporalBadge and NotificationBadge. */
export default function BadgeSections() {
    return (
        <>
            <KitchenSection
                title="Badge"
                note="The web's colours from each META map. Status 60 in LEAD_SOURCE_STATUS_META must show a grey Unknown pill."
            >
                {META_MAPS.map((map) => (
                    <View key={map.name} className="gap-1.5">
                        <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{map.name}</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {getCodes(map).map((code) => (
                                <Badge key={code} meta={map.meta} status={code} />
                            ))}
                        </View>
                    </View>
                ))}
                <View className="gap-1.5">
                    <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        size="sm" (StatusPill)
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {getCodes(META_MAPS[4]).map((code) => (
                            <Badge key={code} meta={LEAD_SOURCE_STATUS_META} status={code} size="sm" />
                        ))}
                    </View>
                </View>
            </KitchenSection>

            <KitchenSection title="TemporalBadge">
                <View className="flex-row flex-wrap gap-2">
                    <TemporalBadge status="UPCOMING" />
                    <TemporalBadge status="TODAY" />
                    <TemporalBadge status="PAST" />
                </View>
            </KitchenSection>

            <KitchenSection
                title="NotificationBadge"
                note="Every badge name, then two legacy emoji and an unknown name (a bell). Bottom row: size sm."
            >
                <View className="flex-row flex-wrap gap-2">
                    {[...NOTIFICATION_BADGE_NAMES, ...EXTRA_BADGES].map((badge) => (
                        <NotificationBadge key={badge} badge={badge} />
                    ))}
                </View>
                <View className="flex-row flex-wrap gap-2">
                    {NOTIFICATION_BADGE_NAMES.map((badge) => (
                        <NotificationBadge key={badge} badge={badge} size="sm" />
                    ))}
                </View>
            </KitchenSection>
        </>
    )
}
