import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import clsx from "clsx"
import { Check } from "lucide-react-native"
import { useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { send } from "@/api/client"
import SearchField from "@/components/list/SearchField"
import { Avatar, Button } from "@/components/ui"
import type { AttendeeOption, RootStackParamList } from "@/navigation/types"
import { PALETTE } from "@/theme"

type Navigation = NativeStackNavigationProp<RootStackParamList, "AttendeePicker">

interface UserOption {
    _id: string
    name: string
    email?: string
    role?: number
    avatar?: string
}

const USERS_PICKER_API = "/api/admin/operations/users/picker"
// The web shows the filter only when there are enough users to scroll.
const FILTER_THRESHOLD = 6

/**
 * Chooses meeting attendees from every active user, loaded once. Ported from the attendee list in the web's
 * MeetingForm.tsx: the same client-side filter on name and email, and the same toggled set of ids.
 */
export default function AttendeePickerScreen() {
    const navigation = useNavigation<Navigation>()
    const { selected } = useRoute<RouteProp<RootStackParamList, "AttendeePicker">>().params
    const insets = useSafeAreaInsets()
    const [allUsers, setAllUsers] = useState<UserOption[]>([])
    const [usersLoading, setUsersLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(selected.map((user) => user._id)))
    const [query, setQuery] = useState("")

    useEffect(() => {
        const controller = new AbortController()
        send<UserOption[]>(USERS_PICKER_API, "GET", undefined, { signal: controller.signal })
            .then((users) => {
                if (Array.isArray(users)) setAllUsers(users)
            })
            // As on the web, a failed load shows the empty list.
            .catch(() => undefined)
            .finally(() => {
                if (!controller.signal.aborted) setUsersLoading(false)
            })
        return () => controller.abort()
    }, [])

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return allUsers
        return allUsers.filter(
            (user) => user.name.toLowerCase().includes(q) || (user.email?.toLowerCase().includes(q) ?? false),
        )
    }, [allUsers, query])

    function toggleAttendee(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function handleDone() {
        // Users already chosen but missing from the list (deactivated since) are kept by their saved name.
        const known = new Map(allUsers.map((user) => [user._id, user.name]))
        for (const user of selected) if (!known.has(user._id)) known.set(user._id, user.name)
        const attendees: AttendeeOption[] = [...selectedIds].map((id) => ({ _id: id, name: known.get(id) ?? "User" }))
        navigation.popTo("ScheduleMeeting", { attendees } as RootStackParamList["ScheduleMeeting"], { merge: true })
    }

    return (
        <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
            {allUsers.length > FILTER_THRESHOLD && (
                <View className="px-4 pt-4">
                    <SearchField value={query} onChangeText={setQuery} placeholder="Filter by name or email…" />
                </View>
            )}
            <FlatList
                data={usersLoading ? [] : filteredUsers}
                keyExtractor={(user) => user._id}
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="p-4"
                renderItem={({ item }) => {
                    const checked = selectedIds.has(item._id)
                    return (
                        <Pressable
                            onPress={() => toggleAttendee(item._id)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked }}
                            accessibilityLabel={item.name}
                            className={clsx(
                                "min-h-[56px] flex-row items-center gap-3 rounded-lg px-3 py-2",
                                checked
                                    ? "bg-blue-50 dark:bg-blue-500/10"
                                    : "active:bg-neutral-50 dark:active:bg-neutral-800/60",
                            )}
                        >
                            <Avatar uri={item.avatar} size={32} name={item.name} />
                            <View className="min-w-0 flex-1">
                                <Text
                                    numberOfLines={1}
                                    className={clsx(
                                        "text-sm",
                                        checked
                                            ? "font-semibold text-blue-700 dark:text-blue-300"
                                            : "font-medium text-neutral-800 dark:text-neutral-200",
                                    )}
                                >
                                    {item.name}
                                </Text>
                                {!!item.email && (
                                    <Text numberOfLines={1} className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {item.email}
                                    </Text>
                                )}
                            </View>
                            <View
                                className={clsx(
                                    "h-5 w-5 items-center justify-center rounded-full border",
                                    checked
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800",
                                )}
                            >
                                {checked && <Check size={12} strokeWidth={3} color={PALETTE.white} />}
                            </View>
                        </Pressable>
                    )
                }}
                ListEmptyComponent={
                    <Text className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                        {usersLoading ? "Loading users…" : query ? "No matches" : "No users available"}
                    </Text>
                }
            />
            <View
                className="border-t border-gray-200 bg-white px-4 pt-3 dark:border-neutral-800 dark:bg-neutral-900"
                style={{ paddingBottom: insets.bottom + 12 }}
            >
                <Button label={`Done (${selectedIds.size} selected)`} onPress={handleDone} />
            </View>
        </View>
    )
}
