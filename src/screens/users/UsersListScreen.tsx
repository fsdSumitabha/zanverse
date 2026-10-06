import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Plus } from "lucide-react-native"
import { View } from "react-native"

import ListScreen from "@/components/list/ListScreen"
import { Button, Fab } from "@/components/ui"
import UserCard, { type UserListItem } from "@/components/users/UserCard"
import UserCardSkeleton from "@/components/users/UserCardSkeleton"
import { useAuth } from "@/contexts/AuthContext"
import { useListQuery } from "@/hooks/useListQuery"
import { canOpen } from "@/navigation/permissions"
import type { UsersStackParamList } from "@/navigation/types"

type Navigation = NativeStackNavigationProp<UsersStackParamList, "UsersList">

const USERS_API = "/api/admin/operations/users"
const PAGE_SIZE = 10
// Room under the last card so the floating button never covers it.
const FAB_SPACE = 72

function getCountLabel(total: number): string {
    return `${total} ${total === 1 ? "user" : "users"} found`
}

/** The staff directory, with search and infinite scroll. Ported from the web's UsersClient.tsx. */
export default function UsersListScreen() {
    const navigation = useNavigation<Navigation>()
    const { role } = useAuth()
    const query = useListQuery<UserListItem>({ path: USERS_API, pageSize: PAGE_SIZE })
    // The web shows "Create New User" to roles 10, 20 and 69, the same list as the create route.
    const canCreate = canOpen("UserCreate", role)
    const canEdit = canOpen("UserEdit", role)

    function openCreate() {
        navigation.navigate("UserCreate")
    }

    return (
        <View className="flex-1">
            <ListScreen
                query={query}
                renderItem={(user) => (
                    <UserCard
                        user={user}
                        onEdit={canEdit ? () => navigation.navigate("UserEdit", { id: user._id }) : undefined}
                    />
                )}
                SkeletonComponent={UserCardSkeleton}
                emptyText="No users found"
                getCountLabel={getCountLabel}
                searchPlaceholder="Search users"
                headerExtra={
                    canCreate ? (
                        <Button label="Create New User" variant="soft" icon={Plus} onPress={openCreate} />
                    ) : undefined
                }
                bottomInset={canCreate ? FAB_SPACE : 0}
            />
            {canCreate && <Fab accessibilityLabel="Create New User" onPress={openCreate} isAboveTabBar />}
        </View>
    )
}
