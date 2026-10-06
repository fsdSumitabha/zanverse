import { useState } from "react"
import { Switch, Text, View } from "react-native"

import { Button, Card, Input, SelectSheet, type SelectOption } from "@/components/ui"
import { USER_ROLE_META, type UserRole } from "@/constants/userRoles"
import { useAuth } from "@/contexts/AuthContext"
import type { LoadedUser, UserFormValues } from "@/lib/userDiff"

import AvatarField from "./AvatarField"
import RegionSelect from "./RegionSelect"
import { useOfflineReason } from "@/hooks/useIsOnline"

interface Props {
    mode: "create" | "edit"
    /** The user being edited. */
    loaded?: LoadedUser
    onSubmit: (form: UserFormValues) => void
    loading?: boolean
    /** Set when editing yourself. Regions become read-only with this text. */
    regionsLockedReason?: string
    /** Server errors by field, such as `{ email: "Email already exists" }`. */
    errors?: Record<string, string>
}

const MIN_PASSWORD = 6
const ADMIN_ROLE = 10
const REQUIRED_MESSAGE = "Please fill out this field."
const PASSWORD_MESSAGE = "Password must be at least 6 characters"

/**
 * One form for a new and an existing staff account. Ported from the web's UserForm.tsx: the same fields, the role
 * list without Admin unless the user already is one, your own region preselected when you hold exactly one, and
 * "Pick at least one region" as the only guard the form itself adds.
 */
export default function UserForm({ mode, loaded, onSubmit, loading = false, regionsLockedReason, errors = {} }: Props) {
    const offlineReason = useOfflineReason()
    const { regions: myRegions } = useAuth()
    const isEdit = mode === "edit"

    // Admin is never assignable, but stays visible when the user already holds it.
    const roleOptions: SelectOption<number>[] = Object.entries(USER_ROLE_META)
        .filter(([key]) => Number(key) !== ADMIN_ROLE || loaded?.role === ADMIN_ROLE)
        .map(([key, meta]) => ({ label: meta.label, value: Number(key) }))

    const [form, setForm] = useState<UserFormValues>(() => ({
        name: loaded?.name ?? "",
        email: loaded?.email ?? "",
        password: "",
        role: loaded?.role ?? (roleOptions[0].value as UserRole),
        // Creating: start with your own region when you have only one, the answer for every single-region user.
        regions: loaded?.regions ?? (myRegions.length === 1 ? myRegions : []),
        isActive: loaded?.isActive ?? true,
        avatar: loaded?.avatar ?? "",
        avatarFile: null,
    }))
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({})

    function update(patch: Partial<UserFormValues>) {
        setForm((current) => ({ ...current, ...patch }))
    }

    function submit() {
        const next: Record<string, string> = {}
        if (!form.name.trim()) next.name = REQUIRED_MESSAGE
        if (!form.email.trim()) next.email = REQUIRED_MESSAGE
        if ((!isEdit && !form.password) || (form.password && form.password.length < MIN_PASSWORD)) {
            next.password = PASSWORD_MESSAGE
        }
        // Checkboxes cannot be required on the web, so this is the form's own guard. The server checks it again.
        if (!regionsLockedReason && form.regions.length === 0) next.regions = "Pick at least one region"
        setLocalErrors(next)
        if (Object.keys(next).length > 0) return
        onSubmit(form)
    }

    const fieldError = (key: string) => localErrors[key] ?? errors[key] ?? null

    return (
        <Card className="gap-4 p-5 dark:border-neutral-700">
            <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {isEdit ? "Edit User" : "Create User"}
            </Text>

            <Input
                label="Name"
                required
                value={form.name}
                onChangeText={(name) => update({ name })}
                placeholder="Enter full name"
                error={fieldError("name")}
            />
            <Input
                label="Email"
                required
                value={form.email}
                onChangeText={(email) => update({ email })}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={fieldError("email")}
            />
            <View className="gap-1">
                <Input
                    label={isEdit ? "New password" : "Password"}
                    required={!isEdit}
                    value={form.password}
                    onChangeText={(password) => update({ password })}
                    placeholder={isEdit ? "Leave blank to keep the current password" : "Enter password"}
                    secureTextEntry
                    autoComplete="new-password"
                    autoCapitalize="none"
                    error={fieldError("password")}
                />
                {isEdit && (
                    <Text className="text-xs text-gray-500 dark:text-neutral-400">
                        Setting a password here replaces the current one immediately.
                    </Text>
                )}
            </View>
            <View className="gap-1">
                <SelectSheet
                    label="Role"
                    required
                    options={roleOptions}
                    value={form.role}
                    onChange={(role) => update({ role: role as UserRole })}
                    error={fieldError("role")}
                />
                <Text className="text-xs text-gray-500 dark:text-neutral-400">
                    {USER_ROLE_META[form.role]?.description}
                </Text>
            </View>

            <View className="gap-1">
                <RegionSelect
                    value={form.regions}
                    onChange={(regions) => update({ regions })}
                    existing={loaded?.regions ?? []}
                    disabled={loading}
                    lockedReason={regionsLockedReason}
                />
                {!!fieldError("regions") && (
                    <Text className="text-xs text-red-600 dark:text-red-400">{fieldError("regions")}</Text>
                )}
            </View>

            <View className="min-h-[44px] flex-row items-center justify-between gap-3">
                <Text className="text-sm text-gray-600 dark:text-gray-300">Active User</Text>
                <Switch
                    value={form.isActive}
                    onValueChange={(isActive) => update({ isActive })}
                    accessibilityLabel="Active User"
                />
            </View>

            <AvatarField
                avatar={form.avatar}
                file={form.avatarFile}
                onPick={(avatarFile) => update({ avatarFile, avatar: "" })}
                onRemove={() => update({ avatarFile: null, avatar: "" })}
                disabled={loading}
            />

            <View className="border-t border-gray-200 pt-4 dark:border-neutral-700">
                <Button
                    disabledReason={offlineReason}
                    label={isEdit ? (loading ? "Saving..." : "Save changes") : loading ? "Creating..." : "Create User"}
                    onPress={submit}
                    disabled={loading}
                />
            </View>
        </Card>
    )
}
