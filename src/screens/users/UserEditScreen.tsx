import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useEffect, useState } from "react"
import { Text, View } from "react-native"

import { ApiError, send } from "@/api/client"
import { Button, Card, FormScrollView } from "@/components/ui"
import UserForm from "@/components/users/UserForm"
import { useAuth } from "@/contexts/AuthContext"
import { notify } from "@/lib/notify"
import { buildUserFormData, type LoadedUser, type UserFormValues } from "@/lib/userDiff"
import type { UsersStackParamList } from "@/navigation/types"

type Navigation = NativeStackNavigationProp<UsersStackParamList, "UserEdit">

const USERS_API = "/api/admin/operations/users"
const TOAST_ID = "user-edit"
const LOADING_DURATION = 60_000

/**
 * Edits one staff account, sending only what changed. Ported from the web's users/[userId]/edit page: the three load
 * states, read-only regions when editing yourself, and "Nothing changed yet" with no request when nothing did.
 */
export default function UserEditScreen() {
    const navigation = useNavigation<Navigation>()
    const { id } = useRoute<RouteProp<UsersStackParamList, "UserEdit">>().params
    const { user: signedInUser } = useAuth()
    const [user, setUser] = useState<LoadedUser | null>(null)
    const [isFetching, setIsFetching] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        let ignore = false
        setIsFetching(true)
        setLoadError(null)
        send<LoadedUser>(`${USERS_API}/${id}`, "GET")
            .then((data) => {
                if (!ignore) setUser(data)
            })
            .catch((error: unknown) => {
                if (!ignore) setLoadError(error instanceof Error ? error.message : "Something went wrong")
            })
            .finally(() => {
                if (!ignore) setIsFetching(false)
            })
        return () => {
            ignore = true
        }
    }, [id])

    async function save(form: UserFormValues) {
        if (!user) return
        const formData = buildUserFormData(form, "edit", user)
        if (!formData) {
            notify.info("Nothing changed yet")
            return
        }
        setIsSaving(true)
        setErrors({})
        notify.info("Saving changes...", { id: TOAST_ID, duration: LOADING_DURATION })
        try {
            const updated = await send<LoadedUser>(`${USERS_API}/${id}`, "PATCH", formData)
            notify.success(`${updated.name} has been updated`, { id: TOAST_ID, description: updated.email })
            setUser(updated)
            navigation.popTo("UsersList")
        } catch (error) {
            const message = error instanceof Error ? error.message : "Something went wrong"
            // A 403 such as "You cannot change your own role" is a toast; the form stays as it is.
            notify.error("Failed to update user", { id: TOAST_ID, description: message })
            if (error instanceof ApiError && error.field) setErrors({ [error.field]: message })
        } finally {
            setIsSaving(false)
        }
    }

    if (isFetching) {
        return (
            <View className="p-4">
                <Card className="p-5">
                    <Text className="text-sm text-gray-500 dark:text-neutral-400">Loading user...</Text>
                </Card>
            </View>
        )
    }

    if (loadError || !user) {
        return (
            <View className="p-4">
                <Card className="gap-4 p-5">
                    <View>
                        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            This user could not be loaded
                        </Text>
                        <Text className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                            {loadError || "The user no longer exists."}
                        </Text>
                    </View>
                    <Button label="Back to users" onPress={() => navigation.popTo("UsersList")} />
                </Card>
            </View>
        )
    }

    return (
        <FormScrollView>
            <UserForm
                key={user._id}
                mode="edit"
                loaded={user}
                onSubmit={save}
                loading={isSaving}
                errors={errors}
                regionsLockedReason={
                    signedInUser?.id === user._id ? "You cannot change your own regions. Ask another admin." : undefined
                }
            />
        </FormScrollView>
    )
}
