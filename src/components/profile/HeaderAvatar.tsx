import { User } from "lucide-react-native"
import { useState } from "react"
import { Pressable, View } from "react-native"

import { Avatar } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"

import ProfileSheet from "./ProfileSheet"

const AVATAR_SIZE = 32

enableIconClassNames(User)

/**
 * The person's photo at the right end of every top bar, beside the bell (Google Photos style). A tap opens the
 * profile sheet: the account, the tools without a tab, App Settings and Log Out.
 */
export default function HeaderAvatar() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Pressable
                onPress={() => setIsOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Profile menu"
                className="h-12 w-12 items-center justify-center rounded-full active:bg-neutral-900/10 dark:active:bg-white/10"
            >
                {user?.avatar ? (
                    <Avatar uri={user.avatar} size={AVATAR_SIZE} name={user.name} />
                ) : (
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-400/25">
                        <User size={18} className="text-blue-800 dark:text-blue-100" />
                    </View>
                )}
            </Pressable>
            <ProfileSheet visible={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
