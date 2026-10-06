import { LogOut, Pencil, User, UserCircle, type LucideIcon } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import { navigationRef } from "@/api/navigationRef"
import { Avatar, Sheet } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"

const AVATAR_SIZE = 32

enableIconClassNames(LogOut, Pencil, User, UserCircle)

function MenuRow({
    icon: Icon,
    label,
    tone,
    onPress,
}: {
    icon: LucideIcon
    label: string
    tone: string
    onPress: () => void
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            className="min-h-[48px] flex-row items-center gap-3 rounded-lg px-4 active:bg-neutral-100 dark:active:bg-neutral-900"
        >
            <Icon size={16} className={tone} />
            <Text className={`text-sm ${tone}`}>{label}</Text>
        </Pressable>
    )
}

/**
 * The person's photo in every stack header, opening the web top bar's profile menu: who is signed in, Profile, Edit
 * profile and Logout.
 */
export default function HeaderAvatar() {
    const { user, loading, logout } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    function openScreen(screen: "Profile" | "ProfileEdit") {
        setIsOpen(false)
        navigationRef.navigate("App", { screen: "MoreTab", params: { screen, initial: false } })
    }

    return (
        <>
            <Pressable
                onPress={() => setIsOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Profile menu"
                className="h-11 w-11 items-center justify-center"
            >
                {user?.avatar ? (
                    <Avatar uri={user.avatar} size={AVATAR_SIZE} name={user.name} />
                ) : (
                    <View className="h-8 w-8 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800">
                        <User size={18} className="text-neutral-700 dark:text-neutral-200" />
                    </View>
                )}
            </Pressable>
            <Sheet visible={isOpen} onClose={() => setIsOpen(false)} accessibilityLabel="Profile menu">
                <View className="px-3 pb-3 pt-2">
                    <View className="px-4 py-2">
                        <Text className="text-xs text-neutral-500">Signed in</Text>
                        <Text numberOfLines={1} className="text-sm font-medium text-neutral-900 dark:text-white">
                            {loading ? "Loading..." : user?.name || "Unknown"}
                        </Text>
                    </View>
                    <View className="my-1 border-t border-neutral-200 dark:border-neutral-800" />
                    <MenuRow
                        icon={UserCircle}
                        label="Profile"
                        tone="text-neutral-900 dark:text-white"
                        onPress={() => openScreen("Profile")}
                    />
                    <MenuRow
                        icon={Pencil}
                        label="Edit profile"
                        tone="text-neutral-900 dark:text-white"
                        onPress={() => openScreen("ProfileEdit")}
                    />
                    <View className="my-1 border-t border-neutral-200 dark:border-neutral-800" />
                    <MenuRow
                        icon={LogOut}
                        label="Logout"
                        tone="text-red-600 dark:text-red-400"
                        onPress={() => {
                            setIsOpen(false)
                            logout()
                        }}
                    />
                </View>
            </Sheet>
        </>
    )
}
