import clsx from "clsx"
import type { ReactNode } from "react"
import { Text, View } from "react-native"

import { toNativeClasses } from "@/lib/nativeClasses"

interface Props {
    label?: string
    required?: boolean
    /** The server's `{ field, message }` text for this field, shown under it. */
    error?: string | null
    className?: string
    children: ReactNode
}

/**
 * The web's FIELD class string (lead-sources/Dialog.tsx), verbatim. Input, Textarea and the SelectSheet trigger
 * use it. On a phone the focus ring becomes a blue border, set by the component.
 */
const WEB_FIELD =
    "w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"

const FIELD = toNativeClasses(WEB_FIELD)

/** The field classes in one string, for a TextInput, which takes box and text styles together. */
export const FIELD_CLASSES = `${FIELD.container} ${FIELD.text} min-h-[44px]`

/** The field's box classes alone, for a Pressable that holds a Text, such as the SelectSheet trigger. */
export const FIELD_BOX_CLASSES = `${FIELD.container} min-h-[44px]`

/** The field's text classes alone. */
export const FIELD_TEXT_CLASSES = FIELD.text

// The label and error classes of the web's LeadForm.
const LABEL_CLASSES = "mb-1 text-sm text-gray-600 dark:text-gray-300"
const ERROR_CLASSES = "mt-1 text-xs text-red-600 dark:text-red-400"

/** A form field's label, required mark and error line around any control. */
export default function Field({ label, required = false, error, className, children }: Props) {
    return (
        <View className={clsx("w-full", className)}>
            {!!label && (
                <Text className={LABEL_CLASSES}>
                    {label}
                    {required && <Text className="text-red-600 dark:text-red-400"> *</Text>}
                </Text>
            )}
            {children}
            {!!error && (
                <Text accessibilityLiveRegion="polite" className={ERROR_CLASSES}>
                    {error}
                </Text>
            )}
        </View>
    )
}
