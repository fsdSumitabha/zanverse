import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useState } from "react"
import { Text } from "react-native"

import { ApiError, send } from "@/api/client"
import { Button, Dialog, FormScrollView } from "@/components/ui"
import UserForm from "@/components/users/UserForm"
import { notify } from "@/lib/notify"
import { buildUserFormData, type UserFormValues } from "@/lib/userDiff"
import type { UsersStackParamList } from "@/navigation/types"
import { useOfflineReason } from "@/hooks/useIsOnline"

type Navigation = NativeStackNavigationProp<UsersStackParamList, "UserCreate">

const USERS_API = "/api/admin/operations/users"
const TOAST_ID = "user-create"
const HTTP_CONFLICT = 409
// Long enough to outlast the request. The success or error toast replaces it.
const LOADING_DURATION = 60_000

/**
 * A new staff account, behind a confirm step, because saving emails the password to the person. Ported from the
 * web's users/create page: the same FormData and the same toasts.
 */
export default function UserCreateScreen() {
    const offlineReason = useOfflineReason()
    const navigation = useNavigation<Navigation>()
    const [pending, setPending] = useState<UserFormValues | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    async function create() {
        if (!pending) return
        const formData = buildUserFormData(pending, "create")
        setPending(null)
        setIsSaving(true)
        setErrors({})
        notify.info("Creating user...", { id: TOAST_ID, duration: LOADING_DURATION })
        try {
            const user = await send<{ name: string; email: string }>(USERS_API, "POST", formData)
            notify.success(`${user.name} has been created`, { id: TOAST_ID, description: user.email })
            navigation.popTo("UsersList")
        } catch (error) {
            const message = error instanceof Error ? error.message : "Something went wrong"
            notify.error("Failed to create user", { id: TOAST_ID, description: message })
            // The duplicate email comes back without a field, so it is routed to the email box here.
            if (error instanceof ApiError && error.status === HTTP_CONFLICT) setErrors({ email: message })
            else if (error instanceof ApiError && error.field) setErrors({ [error.field]: message })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <FormScrollView>
            <UserForm mode="create" onSubmit={setPending} loading={isSaving} errors={errors} />
            <Dialog
                open={pending !== null}
                onClose={() => setPending(null)}
                title="Create this account?"
                footer={
                    <>
                        <Button label="Cancel" variant="quiet" onPress={() => setPending(null)} />
                        <Button disabledReason={offlineReason} label="Create User" onPress={create} />
                    </>
                }
            >
                <Text className="text-sm text-neutral-600 dark:text-neutral-300">The password is emailed to them.</Text>
            </Dialog>
        </FormScrollView>
    )
}
