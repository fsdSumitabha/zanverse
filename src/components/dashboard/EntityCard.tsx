import { Briefcase, Building2, Mail, Phone } from "lucide-react-native"
import { memo } from "react"
import { Pressable, Text, View } from "react-native"

import PhoneText from "@/components/phone/PhoneText"
import { TimeAgo } from "@/components/ui"
import { ENTITY_TYPE } from "@/constants/entityTypes"
import type { FeedItem } from "@/hooks/useDashboardFeed"
import { enableIconClassNames } from "@/lib/iconClassName"

import LastInteraction from "./LastInteraction"

enableIconClassNames(Briefcase, Building2, Mail, Phone)

/** The icon of each entity type, from the web's getEntityConfig. */
function getEntityIcon(entityType: number) {
    return entityType === ENTITY_TYPE.CLIENT ? Building2 : Briefcase
}

/**
 * One feed row: a lead, client or project, its contact line, its description and its latest interaction. Ported
 * from the web's EntityCard.tsx; the hover tints are pressed states, and a tap opens the record in its own tab.
 */
function EntityCard({ item, onPress }: { item: FeedItem; onPress: () => void }) {
    const Icon = getEntityIcon(item.entityType)
    const company = item.company || item.companyName

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={item.name || item.title}
            className="flex-row gap-3 rounded-xl border border-slate-200 bg-white p-4 active:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
        >
            <View className="mt-1">
                <View className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                    <Icon size={16} className="text-neutral-600 dark:text-neutral-300" />
                </View>
            </View>
            <View className="min-w-0 flex-1 gap-3">
                <View>
                    <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {item.name || item.title}
                    </Text>
                    {!!company && (
                        <View className="flex-row items-center gap-1">
                            <Building2 size={12} className="text-neutral-700 dark:text-neutral-300" />
                            <Text className="text-xs text-neutral-700 dark:text-neutral-300">{company}</Text>
                        </View>
                    )}
                </View>
                <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
                    {!!item.phone && (
                        <View className="flex-row items-center gap-1">
                            <Phone size={12} className="text-neutral-700 dark:text-neutral-300" />
                            <PhoneText phone={item.phone} className="text-xs text-neutral-700 dark:text-neutral-300" />
                        </View>
                    )}
                    {!!item.email && (
                        <View className="flex-row items-center gap-1">
                            <Mail size={12} className="text-neutral-700 dark:text-neutral-300" />
                            <Text className="text-xs text-neutral-700 dark:text-neutral-300">{item.email}</Text>
                        </View>
                    )}
                    {!!item.source && (
                        <Text className="text-xs text-neutral-700 dark:text-neutral-300">{item.source}</Text>
                    )}
                    {!!item.lastInteractionAt && (
                        <View className="flex-row items-center gap-1">
                            <Text className="text-xs text-neutral-700 dark:text-neutral-300">•</Text>
                            <TimeAgo date={item.lastInteractionAt} />
                        </View>
                    )}
                </View>
                {!!item.description && (
                    <Text className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</Text>
                )}
                {item.lastInteraction && <LastInteraction entityType={item.entityType} item={item.lastInteraction} />}
            </View>
        </Pressable>
    )
}

export default memo(EntityCard)
