import { Users } from "lucide-react-native"
import { Text, View } from "react-native"

import { USER_ROLE_META, type UserRole } from "@/constants/userRoles"
import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import type { OverallStats } from "@/types/overallStats"

import { STATS_CARD_CLASSES, TONE } from "./statsTones"

const ICON_TONE = toNativeClasses(TONE.rose.icon)

enableIconClassNames(Users)

/** A role code's label from the copied constants, or "Role 25" for a code the app does not know yet. */
export function getRoleCountLabel(role: number): string {
    return USER_ROLE_META[role as UserRole]?.label ?? `Role ${role}`
}

/** The team by role, largest first, with the active and inactive counts. From `users.byRole`, keyed by role code. */
export default function RoleCountsCard({ users }: { users: OverallStats["users"] }) {
    const rows = Object.entries(users.byRole)
        .map(([role, count]) => ({ role: Number(role), count }))
        .sort((a, b) => b.count - a.count)

    return (
        <View className={STATS_CARD_CLASSES}>
            <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-2">
                    <View className={`h-7 w-7 items-center justify-center rounded-md ${ICON_TONE.container}`}>
                        <Users size={16} className={ICON_TONE.text} />
                    </View>
                    <Text className="text-base font-semibold text-neutral-900 dark:text-white">Team</Text>
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">{users.total}</Text>
                </View>
                <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {`${users.active} active · ${users.inactive} inactive`}
                </Text>
            </View>
            {rows.length === 0 ? (
                <Text className="mt-4 text-sm text-neutral-500">No users yet</Text>
            ) : (
                <View className="mt-3">
                    {rows.map((row) => (
                        <View
                            key={row.role}
                            className="min-h-[36px] flex-row items-center gap-3 border-t border-slate-100 dark:border-neutral-800"
                        >
                            <Text numberOfLines={1} className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">
                                {getRoleCountLabel(row.role)}
                            </Text>
                            <Text className="text-sm font-semibold text-neutral-900 dark:text-white">{row.count}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    )
}
