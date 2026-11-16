import { BottomSheetFlatList } from "@gorhom/bottom-sheet"
import clsx from "clsx"
import { Check, ChevronDown } from "lucide-react-native"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native"

import { PALETTE } from "@/theme"

import Field, { FIELD_BOX_CLASSES, FIELD_TEXT_CLASSES } from "./Field"
import Sheet from "./Sheet"

export interface SelectOption<T extends string | number> {
    label: string
    value: T
}

interface Props<T extends string | number> {
    label?: string
    required?: boolean
    error?: string | null
    placeholder?: string
    options: SelectOption<T>[]
    value: T | null | undefined
    onChange: (value: T) => void
    /** The sheet's heading. Defaults to the label. */
    title?: string
    disabled?: boolean
    className?: string
}

/**
 * A labelled field that opens a bottom sheet of options, with a check on the current one. It replaces every web
 * <select> and the lead-sources Popover menus.
 */
export default function SelectSheet<T extends string | number>({
    label,
    required = false,
    error,
    placeholder = "Select…",
    options,
    value,
    onChange,
    title,
    disabled = false,
    className,
}: Props<T>) {
    const [isOpen, setIsOpen] = useState(false)
    const isDarkMode = useColorScheme() === "dark"
    const selected = options.find((option) => option.value === value)
    const heading = title ?? label ?? placeholder

    function handleSelect(next: T) {
        onChange(next)
        setIsOpen(false)
    }

    return (
        <Field label={label} required={required} error={error} className={className}>
            <Pressable
                onPress={() => setIsOpen(true)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={
                    label ? `${label}: ${selected?.label ?? placeholder}` : selected?.label ?? placeholder
                }
                accessibilityState={{ disabled, expanded: isOpen }}
                className={clsx(
                    FIELD_BOX_CLASSES,
                    "flex-row items-center justify-between gap-2",
                    disabled && "opacity-50",
                )}
                style={error ? { borderColor: PALETTE["red-500"] } : undefined}
            >
                <Text
                    numberOfLines={1}
                    className={clsx("flex-1", FIELD_TEXT_CLASSES)}
                    style={selected ? undefined : { color: PALETTE["neutral-400"] }}
                >
                    {selected?.label ?? placeholder}
                </Text>
                <ChevronDown size={16} color={PALETTE["neutral-400"]} />
            </Pressable>

            <Sheet visible={isOpen} onClose={() => setIsOpen(false)} accessibilityLabel={heading}>
                <Text className="px-5 pb-2 pt-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {heading}
                </Text>
                <BottomSheetFlatList
                    data={options}
                    style={styles.list}
                    keyExtractor={(option) => String(option.value)}
                    renderItem={({ item }) => {
                        const isSelected = item.value === value
                        return (
                            <Pressable
                                onPress={() => handleSelect(item.value)}
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
                                    {item.label}
                                </Text>
                                {isSelected && (
                                    <Check size={18} color={isDarkMode ? PALETTE["blue-400"] : PALETTE["blue-600"]} />
                                )}
                            </Pressable>
                        )
                    }}
                    ListEmptyComponent={
                        <View className="px-5 py-6">
                            <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                                No options
                            </Text>
                        </View>
                    }
                />
            </Sheet>
        </Field>
    )
}

// A long option list shrinks inside the sheet's height cap and scrolls. The list is the sheet's own, which NativeWind
// does not map className on.
const styles = StyleSheet.create({
    list: {
        flexShrink: 1,
    },
})
