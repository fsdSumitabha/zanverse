import clsx from "clsx"
import { Mail, Shield, User } from "lucide-react-native"
import { Text, View } from "react-native"

import { Avatar } from "@/components/ui"
import { USER_ROLE_META, type UserRole } from "@/constants/userRoles"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { AuthProfileUser } from "@/types/authProfile"

interface Props {
    profile: AuthProfileUser
    /** 96 on the profile screen, 80 on the edit screen. */
    avatarSize?: number
    /** The edit screen shows only name, email and role. */
    isCompact?: boolean
}

const DEFAULT_AVATAR_SIZE = 96

enableIconClassNames(Mail, Shield, User)

/** "Admin", or "Role 99" for a code the app does not know. */
export function getRoleLabel(role: number): string {
    return USER_ROLE_META[role as UserRole]?.label ?? `Role ${role}`
}

/** The signed-in person: photo, name, email, role and the Active pill. Ported from the web's profile page. */
export default function ProfileCard({ profile, avatarSize = DEFAULT_AVATAR_SIZE, isCompact = false }: Props) {
    const hasAvatar = !!profile.avatar?.trim()
    const roleLabel = getRoleLabel(profile.role)

    return (
        <View className="flex-row items-center gap-4">
            <View
                className="items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/10"
                style={{ width: avatarSize, height: avatarSize }}
            >
                {hasAvatar ? (
                    <Avatar uri={profile.avatar} size={avatarSize} name={profile.name} />
                ) : (
                    <User size={Math.round(avatarSize * 0.42)} strokeWidth={1.5} className="text-emerald-500" />
                )}
            </View>
            <View className="min-w-0 flex-1 gap-1">
                <Text numberOfLines={1} className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {profile.name}
                </Text>
                <View className="flex-row items-center gap-2">
                    <Mail size={16} className="text-neutral-500 dark:text-neutral-400" />
                    <Text numberOfLines={1} className="flex-shrink text-sm text-neutral-500 dark:text-neutral-400">
                        {profile.email}
                    </Text>
                </View>
                {isCompact ? (
                    <Text className="text-xs text-neutral-500">{roleLabel}</Text>
                ) : (
                    <View className="flex-row flex-wrap items-center gap-2 pt-1">
                        <View className="flex-row items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 dark:bg-neutral-800">
                            <Shield size={14} className="text-neutral-700 dark:text-neutral-300" />
                            <Text className="text-xs text-neutral-700 dark:text-neutral-300">{roleLabel}</Text>
                        </View>
                        <Text
                            className={clsx(
                                "rounded-full px-2.5 py-1 text-xs font-medium",
                                profile.isActive
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : "bg-red-500/15 text-red-700 dark:text-red-400",
                            )}
                        >
                            {profile.isActive ? "Active" : "Inactive"}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    )
}
