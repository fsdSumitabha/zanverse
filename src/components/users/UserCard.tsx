import clsx from "clsx"
import { Pencil } from "lucide-react-native"
import { memo } from "react"
import { Pressable, Text, View } from "react-native"

import RegionBadges from "@/components/region/RegionBadges"
import { Avatar, Card, InlineValue, TimeAgo } from "@/components/ui"
import { USER_ROLE_META, type UserRole } from "@/constants/userRoles"
import { enableIconClassNames } from "@/lib/iconClassName"

/** A user as `GET /users` lists them. */
export interface UserListItem {
    _id: string
    name: string
    email: string
    role: UserRole
    regions?: string[]
    isActive: boolean
    avatar?: string
    lastLoginAt?: string
    createdAt: string
    createdBy?: { _id: string; name: string; email: string; role: UserRole }
}

interface Props {
    user: UserListItem
    /** Present when the signed-in role may edit users. */
    onEdit?: () => void
}

const AVATAR_SIZE = 48

enableIconClassNames(Pencil)

/** One staff account. Ported from the web's UserCard.tsx; the web's floating pencil is a button in the header row. */
function UserCard({ user, onEdit }: Props) {
    const roleMeta = USER_ROLE_META[user.role]
    const isInactive = !user.isActive

    return (
        <Card className={clsx("gap-3 p-4", isInactive && "opacity-60")}>
            <View className="flex-row items-center gap-3">
                {user.avatar ? (
                    <Avatar uri={user.avatar} size={AVATAR_SIZE} name={user.name} />
                ) : (
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-700">
                        <Text className="text-lg font-semibold text-gray-700 dark:text-neutral-200">
                            {user.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View className="min-w-0 flex-1">
                    <Text
                        numberOfLines={1}
                        className={clsx(
                            "font-semibold",
                            isInactive ? "text-gray-400 dark:text-neutral-500" : "text-gray-900 dark:text-white",
                        )}
                    >
                        {user.name}
                    </Text>
                    <Text
                        numberOfLines={1}
                        className={clsx(
                            "text-sm",
                            isInactive ? "text-gray-400 dark:text-neutral-500" : "text-gray-500 dark:text-neutral-400",
                        )}
                    >
                        {user.email}
                    </Text>
                </View>
                <Text
                    className={clsx(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        user.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-neutral-400",
                    )}
                >
                    {user.isActive ? "Active" : "Inactive"}
                </Text>
                {onEdit && (
                    <Pressable
                        onPress={onEdit}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${user.name}`}
                        className="h-11 w-11 items-center justify-center rounded-lg border border-gray-300 active:bg-blue-500/10 dark:border-neutral-700"
                    >
                        <Pencil size={14} className="text-gray-500 dark:text-neutral-400" />
                    </Pressable>
                )}
            </View>

            <View className="border-t border-gray-200 dark:border-neutral-800" />

            <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                    <Text className="text-sm text-gray-500 dark:text-neutral-400">
                        Role :
                        <Text className="text-gray-400 dark:text-neutral-500"> {roleMeta?.label || "Unknown"}</Text>
                    </Text>
                    <InlineValue value={roleMeta?.description || "No description available"} />
                </View>
                <View className="items-end">
                    <Text className="text-sm text-gray-500 dark:text-neutral-400">Joined</Text>
                    <TimeAgo date={user.createdAt} />
                </View>
            </View>

            <View className="flex-row items-center gap-2">
                <Text className="text-sm text-gray-500 dark:text-neutral-400">Regions :</Text>
                <RegionBadges regions={user.regions} />
            </View>

            <View className="flex-row items-center justify-between">
                {user.lastLoginAt ? (
                    <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-gray-500 dark:text-neutral-400">Last login:</Text>
                        <TimeAgo date={user.lastLoginAt} />
                    </View>
                ) : (
                    <Text className="text-xs text-gray-500 dark:text-neutral-400">No login yet</Text>
                )}
                {isInactive && <Text className="text-xs font-medium text-red-400 dark:text-red-500">Disabled</Text>}
            </View>

            {!!user.createdBy && <InlineValue value={`Created by ${user.createdBy.name}`} />}
        </Card>
    )
}

export default memo(UserCard)
