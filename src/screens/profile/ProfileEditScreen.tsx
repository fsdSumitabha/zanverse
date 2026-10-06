import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Camera, Lock, type LucideIcon } from "lucide-react-native"
import { useState, type ReactNode } from "react"
import { Text, View } from "react-native"

import { sendRaw } from "@/api/client"
import { AUTH_API } from "@/api/endpoints"
import PasswordField from "@/components/profile/PasswordField"
import PhotoSourceSheet from "@/components/profile/PhotoSourceSheet"
import ProfileCard from "@/components/profile/ProfileCard"
import { Button, Card, FormScrollView } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { enableIconClassNames } from "@/lib/iconClassName"
import { notify } from "@/lib/notify"
import { pickAvatarImage } from "@/lib/pickAvatar"
import type { MoreStackParamList } from "@/navigation/types"
import type { AuthProfileUser } from "@/types/authProfile"

type Navigation = NativeStackNavigationProp<MoreStackParamList, "ProfileEdit">

const COMPACT_AVATAR = 80
const MIN_PASSWORD = 6
// The password route answers a wrong current password with 401; this one must not end the session.
const WRONG_PASSWORD_MESSAGE = "Old password is incorrect"

enableIconClassNames(Camera, Lock)

function Section({
    icon: Icon,
    title,
    subtitle,
    children,
}: {
    icon: LucideIcon
    title: string
    subtitle: string
    children: ReactNode
}) {
    return (
        <Card className="gap-4 p-5">
            <View className="flex-row items-start gap-3">
                <View className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                    <Icon size={20} className="text-neutral-600 dark:text-neutral-300" />
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
                    <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</Text>
                </View>
            </View>
            {children}
        </Card>
    )
}

/**
 * Two jobs only: replace the photo from the camera or the gallery, and change the password. Name, email and role are
 * read-only. Ported from the web's profile/edit page.
 */
export default function ProfileEditScreen() {
    const navigation = useNavigation<Navigation>()
    const { refreshUser } = useAuth()
    const detail = useDetailQuery<AuthProfileUser>(AUTH_API.PROFILE)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [shown, setShown] = useState({ old: false, new: false, confirm: false })
    const [isSaving, setIsSaving] = useState(false)

    async function changePhoto(source: "camera" | "library") {
        setIsSheetOpen(false)
        let picked
        try {
            picked = await pickAvatarImage({ source, invalidTypeMessage: "Invalid file type (JPEG or PNG only)" })
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to update avatar")
            return
        }
        if (!picked) return
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("avatarFile", { uri: picked.uri, name: picked.name, type: picked.type } as unknown as Blob)
            const json = await sendRaw<{ message?: string }>(AUTH_API.PROFILE_AVATAR, "POST", formData)
            detail.refetch()
            await refreshUser()
            notify.success(json.message || "Avatar updated")
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to update avatar")
        } finally {
            setIsUploading(false)
        }
    }

    async function changePassword() {
        if (!oldPassword || !newPassword) {
            notify.error("Please fill in all password fields")
            return
        }
        if (newPassword.length < MIN_PASSWORD) {
            notify.error("New password must be at least 6 characters")
            return
        }
        if (newPassword !== confirmPassword) {
            notify.error("New password and confirmation do not match")
            return
        }
        setIsSaving(true)
        try {
            const json = await sendRaw<{ message?: string }>(
                AUTH_API.PROFILE_PASSWORD,
                "PATCH",
                { oldPassword, newPassword },
                { keepSessionOn401Message: WRONG_PASSWORD_MESSAGE },
            )
            notify.success(json.message || "Password updated")
            setOldPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setShown({ old: false, new: false, confirm: false })
            navigation.goBack()
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to update password")
        } finally {
            setIsSaving(false)
        }
    }

    if (detail.loading) {
        return (
            <View className="p-4">
                <Card className="p-8">
                    <Text className="text-neutral-600 dark:text-neutral-400">Loading…</Text>
                </Card>
            </View>
        )
    }

    if (!detail.data) {
        return (
            <View className="p-4">
                <Card className="p-8">
                    <Text className="text-red-500">Could not load your profile.</Text>
                </Card>
            </View>
        )
    }

    return (
        <FormScrollView>
            <View>
                <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Edit profile</Text>
                <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Update your photo or password
                </Text>
            </View>
            <Card className="p-5">
                <ProfileCard profile={detail.data} avatarSize={COMPACT_AVATAR} isCompact />
            </Card>

            <Section icon={Camera} title="Profile photo" subtitle="JPEG or PNG, up to 5 MB.">
                <Button
                    label={isUploading ? "Uploading…" : "Change photo"}
                    variant="quiet"
                    onPress={() => setIsSheetOpen(true)}
                    disabled={isUploading}
                    className="self-start"
                />
            </Section>

            <Section icon={Lock} title="Change password" subtitle="Enter your current password, then choose a new one.">
                <PasswordField
                    label="Current password"
                    value={oldPassword}
                    onChange={setOldPassword}
                    autoComplete="current-password"
                    isShown={shown.old}
                    onToggleShow={() => setShown((current) => ({ ...current, old: !current.old }))}
                />
                <PasswordField
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                    isShown={shown.new}
                    onToggleShow={() => setShown((current) => ({ ...current, new: !current.new }))}
                />
                <PasswordField
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    isShown={shown.confirm}
                    onToggleShow={() => setShown((current) => ({ ...current, confirm: !current.confirm }))}
                />
                <View className="flex-row flex-wrap gap-3">
                    <Button
                        label={isSaving ? "Saving…" : "Update password"}
                        onPress={changePassword}
                        disabled={isSaving}
                    />
                    <Button label="Cancel" variant="quiet" onPress={() => navigation.goBack()} disabled={isSaving} />
                </View>
            </Section>

            <PhotoSourceSheet visible={isSheetOpen} onClose={() => setIsSheetOpen(false)} onPick={changePhoto} />
        </FormScrollView>
    )
}
