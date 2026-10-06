import clsx from "clsx"
import { Check } from "lucide-react-native"
import { useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, Text, View } from "react-native"

import { send } from "@/api/client"
import SearchField from "@/components/list/SearchField"
import { Sheet } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"

interface UserOption {
    _id: string
    name?: string
    email?: string
}

interface Props {
    visible: boolean
    value: string
    onClose: () => void
    onChange: (userId: string, label: string) => void
}

const USERS_PATH = "/api/admin/operations/users?limit=100"

enableIconClassNames(Check)

/**
 * The web's 100-user select as a searchable list: loaded once on first open, filtered on the phone by name or email.
 * A failed load leaves the list empty, as on the web; the name search on the filter sheet still works.
 */
export default function UserPickerModal({ visible, value, onClose, onChange }: Props) {
    const [users, setUsers] = useState<UserOption[]>([])
    const [hasLoaded, setHasLoaded] = useState(false)
    const [term, setTerm] = useState("")

    useEffect(() => {
        if (!visible || hasLoaded) return
        let isCancelled = false
        send<UserOption[]>(USERS_PATH, "GET")
            .then((data) => {
                if (!isCancelled && Array.isArray(data)) setUsers(data)
            })
            .catch(() => undefined)
            .finally(() => {
                if (!isCancelled) setHasLoaded(true)
            })
        return () => {
            isCancelled = true
        }
    }, [visible, hasLoaded])

    const options = useMemo(() => {
        const q = term.trim().toLowerCase()
        const list = q
            ? users.filter((user) => `${user.name ?? ""} ${user.email ?? ""}`.toLowerCase().includes(q))
            : users
        return [{ _id: "", name: "All users" }, ...list]
    }, [users, term])

    return (
        <Sheet visible={visible} onClose={onClose} accessibilityLabel="User">
            <View className="gap-2 px-5 pb-2 pt-3">
                <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">User</Text>
                <SearchField value={term} onChangeText={setTerm} placeholder="Search users" />
            </View>
            <FlatList
                data={options}
                keyExtractor={(user) => user._id || "all"}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                    const label = item.name || item.email || item._id
                    const isSelected = item._id === value
                    return (
                        <Pressable
                            onPress={() => onChange(item._id, item._id ? label : "")}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            className="min-h-[48px] flex-row items-center justify-between gap-3 px-5 py-3 active:bg-neutral-100 dark:active:bg-neutral-800"
                        >
                            <Text
                                numberOfLines={1}
                                className={clsx(
                                    "flex-1 text-sm text-neutral-800 dark:text-neutral-100",
                                    isSelected && "font-semibold",
                                )}
                            >
                                {label}
                            </Text>
                            {isSelected && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                        </Pressable>
                    )
                }}
            />
        </Sheet>
    )
}
