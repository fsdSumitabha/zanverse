import { Building2, Calendar, Folder, User, UserCog, type LucideIcon } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import type { SearchEntity, SearchHit } from "@/types/search"

const ICON: Record<SearchEntity, LucideIcon> = {
    LEAD: User,
    CLIENT: Building2,
    PROJECT: Folder,
    MEETING: Calendar,
    USER: UserCog,
}

const ICON_COLOR: Record<SearchEntity, string> = {
    LEAD: "text-blue-500 bg-blue-500/10",
    CLIENT: "text-emerald-500 bg-emerald-500/10",
    PROJECT: "text-purple-500 bg-purple-500/10",
    MEETING: "text-cyan-500 bg-cyan-500/10",
    USER: "text-indigo-500 bg-indigo-500/10",
}

enableIconClassNames(Building2, Calendar, Folder, User, UserCog)

/** One search hit: the type icon, the title and the subtitle. Ported from the web's search/SearchResultRow.tsx. */
export default function SearchResultRow({ hit, onSelect }: { hit: SearchHit; onSelect: (hit: SearchHit) => void }) {
    const Icon = ICON[hit.type] ?? User
    const color = toNativeClasses(ICON_COLOR[hit.type] ?? ICON_COLOR.LEAD)
    return (
        <Pressable
            onPress={() => onSelect(hit)}
            accessibilityRole="button"
            accessibilityLabel={hit.subtitle ? `${hit.title}, ${hit.subtitle}` : hit.title}
            className="min-h-[44px] flex-row items-center gap-3 px-4 py-2 active:bg-neutral-100 dark:active:bg-neutral-800"
        >
            <View className={`h-7 w-7 items-center justify-center rounded-md ${color.container}`}>
                <Icon size={14} className={color.text} />
            </View>
            <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {hit.title}
                </Text>
                {!!hit.subtitle && (
                    <Text numberOfLines={1} className="text-xs text-neutral-500 dark:text-neutral-400">
                        {hit.subtitle}
                    </Text>
                )}
            </View>
        </Pressable>
    )
}
