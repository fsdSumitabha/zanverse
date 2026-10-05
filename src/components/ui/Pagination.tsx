import clsx from "clsx"
import { Pressable, Text, View } from "react-native"

import { toNativeClasses } from "@/lib/nativeClasses"

interface Props {
    page: number
    totalPages: number
    /** Disables both buttons, for example while a fetch is in flight. */
    disabled?: boolean
    onChange: (page: number) => void
}

// Verbatim from the web's Pagination.tsx. Lists normally load more with onEndReached; this is the fallback.
const WEB_PAGE_BUTTON =
    "px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"

const PAGE_BUTTON = toNativeClasses(WEB_PAGE_BUTTON)

// The web's button is 28 px tall. 44 dp is the minimum touch target on a phone.
const PRESSABLE_CLASSES = "min-h-[44px] justify-center active:bg-neutral-300 dark:active:bg-neutral-700"

interface PageButtonProps {
    label: string
    isDisabled: boolean
    onPress: () => void
}

function PageButton({ label, isDisabled, onPress }: PageButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled }}
            className={clsx(PAGE_BUTTON.container, PRESSABLE_CLASSES, isDisabled && "opacity-50")}
        >
            <Text className={PAGE_BUTTON.text}>{label}</Text>
        </Pressable>
    )
}

/** Previous / "Page x of y" / Next, driven entirely by props. */
export default function Pagination({ page, totalPages, disabled = false, onChange }: Props) {
    return (
        <View className="flex-row items-center justify-between pt-4">
            <PageButton label="Previous" isDisabled={page <= 1 || disabled} onPress={() => onChange(page - 1)} />
            <Text className="text-sm text-neutral-500 dark:text-gray-400">
                Page {page} of {totalPages}
            </Text>
            <PageButton label="Next" isDisabled={page >= totalPages || disabled} onPress={() => onChange(page + 1)} />
        </View>
    )
}
