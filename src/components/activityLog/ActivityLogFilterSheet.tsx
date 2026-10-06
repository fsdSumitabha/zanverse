import clsx from "clsx"
import { ChevronDown, X } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import DateField from "@/components/list/DateField"
import { Button, FIELD_BOX_CLASSES, FIELD_CLASSES, Sheet } from "@/components/ui"
import { ENTITY_TYPE_META, type EntityType } from "@/constants/entityTypes"
import { formatLocalDate } from "@/lib/dates"
import { enableIconClassNames } from "@/lib/iconClassName"
import { PALETTE } from "@/theme"
import { EMPTY_FILTERS, type ActivityLogFilterState } from "@/types/activityLog"

import UserPickerModal from "./UserPickerModal"
import SheetTextInput from "@/components/ui/SheetTextInput"
import { SheetScrollView } from "@/components/ui/sheetScrollables"

interface Props {
    visible: boolean
    onClose: () => void
    value: ActivityLogFilterState
    onChange: (next: ActivityLogFilterState) => void
    /** Admins also filter by user and search by name. The profile screen does not. */
    isAdmin: boolean
}

const LABEL = "text-[11px] font-medium uppercase tracking-wide text-neutral-500"
const ENTITY_OPTIONS = Object.entries(ENTITY_TYPE_META).map(([key, meta]) => ({
    value: Number(key) as EntityType,
    label: meta.label,
}))

enableIconClassNames(ChevronDown, X)

/** True when any filter is set. `entityType` is compared with "" because 0 (Lead) is a real value. */
export function hasActiveFilters(value: ActivityLogFilterState): boolean {
    return value.entityType !== "" || value.userId !== "" || value.from !== "" || value.to !== "" || value.q !== ""
}

/**
 * Entity, dates, user and name search, stacked in a sheet because they do not fit side by side on a phone. Ported
 * from the web's ActivityLogFilters.tsx. Each change applies at once, as on the web.
 */
export default function ActivityLogFilterSheet({ visible, onClose, value, onChange, isAdmin }: Props) {
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [userLabel, setUserLabel] = useState("")
    const today = formatLocalDate(new Date())

    function update(patch: Partial<ActivityLogFilterState>) {
        onChange({ ...value, ...patch })
    }

    function chip(isActive: boolean) {
        return clsx(
            "min-h-[40px] justify-center rounded-lg border px-3",
            isActive
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                : "border-neutral-300 dark:border-neutral-700",
        )
    }

    return (
        <Sheet visible={visible} onClose={onClose} accessibilityLabel="Filters">
            <SheetScrollView contentContainerClassName="gap-4 px-5 pb-4 pt-3" keyboardShouldPersistTaps="handled">
                <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Filters</Text>

                <View className="gap-1.5">
                    <Text className={LABEL}>Entity</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                        {[{ value: "" as const, label: "All entities" }, ...ENTITY_OPTIONS].map((option) => {
                            const isActive = value.entityType === option.value
                            return (
                                <Pressable
                                    key={String(option.value)}
                                    onPress={() => update({ entityType: option.value })}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isActive }}
                                    className={chip(isActive)}
                                    hitSlop={2}
                                >
                                    <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                                        {option.label}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </View>
                </View>

                <View className="flex-row gap-3">
                    <DateField
                        label="From"
                        value={value.from || today}
                        max={value.to || undefined}
                        active={!!value.from}
                        onChange={(from) => update({ from })}
                    />
                    <DateField
                        label="To"
                        value={value.to || today}
                        min={value.from || undefined}
                        active={!!value.to}
                        onChange={(to) => update({ to })}
                    />
                </View>

                {isAdmin && (
                    <>
                        <View className="gap-1">
                            <Text className={LABEL}>User</Text>
                            <Pressable
                                onPress={() => setIsPickerOpen(true)}
                                accessibilityRole="button"
                                accessibilityLabel={`User: ${value.userId ? userLabel || "Selected" : "All users"}`}
                                className={clsx(FIELD_BOX_CLASSES, "flex-row items-center justify-between")}
                            >
                                <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                                    {value.userId ? userLabel || "Selected" : "All users"}
                                </Text>
                                <ChevronDown size={16} color={PALETTE["neutral-400"]} />
                            </Pressable>
                        </View>
                        <SheetTextInput
                            value={value.q}
                            onChangeText={(q) => update({ q })}
                            editable={!value.userId}
                            placeholder="Search by user name…"
                            placeholderTextColor={PALETTE["neutral-400"]}
                            accessibilityLabel="Search by user name"
                            accessibilityHint={value.userId ? "Clear the User filter to search by name" : undefined}
                            className={clsx(FIELD_CLASSES, value.userId && "opacity-50")}
                        />
                    </>
                )}

                <View className="flex-row items-center justify-between gap-2">
                    {hasActiveFilters(value) ? (
                        <Pressable
                            onPress={() => {
                                setUserLabel("")
                                onChange({ ...EMPTY_FILTERS })
                            }}
                            accessibilityRole="button"
                            className="min-h-[44px] flex-row items-center gap-1.5 rounded-lg border border-neutral-300 px-3 dark:border-neutral-700"
                        >
                            <X size={16} className="text-neutral-700 dark:text-neutral-300" />
                            <Text className="text-sm text-neutral-700 dark:text-neutral-300">Reset</Text>
                        </Pressable>
                    ) : (
                        <View />
                    )}
                    <Button label="Done" onPress={onClose} />
                </View>
            </SheetScrollView>

            {isAdmin && (
                <UserPickerModal
                    visible={isPickerOpen}
                    value={value.userId}
                    onClose={() => setIsPickerOpen(false)}
                    onChange={(userId, label) => {
                        setUserLabel(label)
                        setIsPickerOpen(false)
                        update({ userId })
                    }}
                />
            )}
        </Sheet>
    )
}
