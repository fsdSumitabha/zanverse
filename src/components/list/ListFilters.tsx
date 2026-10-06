import clsx from "clsx"
import { X } from "lucide-react-native"
import { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"

import { Button, Sheet } from "@/components/ui"
import { clampDate, MIN_DATE, todayLocal } from "@/lib/dates"
import { enableIconClassNames } from "@/lib/iconClassName"

import DateField from "./DateField"
import { SheetScrollView } from "@/components/ui/sheetScrollables"

export interface ListFilterValues {
    status: string
    from: string
    to: string
}

interface Props {
    visible: boolean
    /** Status code → metadata. Built from each entity's *_STATUS_META. */
    statusMeta: Record<string | number, { label: string }>
    /** The filters in force when the sheet opens. */
    value: ListFilterValues
    /** Called once, when the sheet closes, with the filters to apply. */
    onApply: (next: ListFilterValues) => void
    onClose: () => void
    /** Leave out the date range, for lists the server does not filter by date. */
    hideDates?: boolean
}

const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-neutral-700 dark:text-neutral-300"
const CHIP_BASE = "min-h-[36px] justify-center rounded-full border px-3 py-1.5"
const CHIP_ON = "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
const CHIP_OFF = "border-slate-300 dark:border-neutral-700"

enableIconClassNames(X)

interface ChipProps {
    label: string
    isSelected: boolean
    onPress: () => void
}

function StatusChip({ label, isSelected, onPress }: ChipProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={clsx(CHIP_BASE, isSelected ? CHIP_ON : CHIP_OFF)}
        >
            <Text
                className={clsx(
                    "text-sm",
                    isSelected
                        ? "font-medium text-blue-700 dark:text-blue-300"
                        : "text-neutral-700 dark:text-neutral-200",
                )}
            >
                {label}
            </Text>
        </Pressable>
    )
}

/**
 * The status and date-range filter, as a bottom sheet. Ported from the web's ListFilters.tsx: the same status list from
 * a META map, From defaulting to 2026-01-01 and To to today, both shown muted until chosen, and "Clear filters" only
 * when something is set. Changes are drafts until the sheet closes, then applied in one call.
 */
export default function ListFilters({ visible, statusMeta, value, onApply, onClose, hideDates = false }: Props) {
    const [draft, setDraft] = useState<ListFilterValues>(value)
    const today = todayLocal()

    // Start from the filters in force each time the sheet opens.
    useEffect(() => {
        if (visible) setDraft(value)
        // Only on opening. While open, the draft is the person's.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible])

    const fromValue = draft.from || MIN_DATE
    const toValue = draft.to || today
    const hasActive = Boolean(draft.status || draft.from || draft.to)

    function update(patch: Partial<ListFilterValues>) {
        setDraft((current) => ({ ...current, ...patch }))
    }

    function handleClose() {
        onApply(draft)
        onClose()
    }

    return (
        <Sheet visible={visible} onClose={handleClose} accessibilityLabel="Filters">
            <SheetScrollView contentContainerClassName="gap-5 px-5 pb-4 pt-3">
                <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Filters</Text>

                <View className="gap-2">
                    <Text className={LABEL_CLASSES}>Status</Text>
                    <View className="flex-row flex-wrap gap-2">
                        <StatusChip
                            label="All statuses"
                            isSelected={!draft.status}
                            onPress={() => update({ status: "" })}
                        />
                        {Object.entries(statusMeta).map(([code, meta]) => (
                            <StatusChip
                                key={code}
                                label={meta.label}
                                isSelected={draft.status === code}
                                onPress={() => update({ status: code })}
                            />
                        ))}
                    </View>
                </View>

                {!hideDates && (
                    <View className="flex-row gap-3">
                        <DateField
                            label="From"
                            value={fromValue}
                            min={MIN_DATE}
                            max={toValue}
                            active={!!draft.from}
                            onChange={(raw) => update({ from: raw ? clampDate(raw, today) : "" })}
                        />
                        <DateField
                            label="To"
                            value={toValue}
                            min={fromValue}
                            max={today}
                            active={!!draft.to}
                            onChange={(raw) => update({ to: raw ? clampDate(raw, today) : "" })}
                        />
                    </View>
                )}

                <View className="flex-row items-center justify-end gap-2">
                    {hasActive && (
                        <Button
                            label="Clear filters"
                            variant="quiet"
                            icon={X}
                            onPress={() => setDraft({ status: "", from: "", to: "" })}
                        />
                    )}
                    <Button label="Done" onPress={handleClose} />
                </View>
            </SheetScrollView>
        </Sheet>
    )
}
