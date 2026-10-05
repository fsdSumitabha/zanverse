import { X } from "lucide-react-native"
import type { ReactNode } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"

import { PALETTE } from "@/theme"

import Sheet from "./Sheet"

interface Props {
    open: boolean
    onClose: () => void
    title: string
    description?: ReactNode
    children: ReactNode
    /** The button row at the bottom, usually Buttons: quiet "Cancel", then the primary action. */
    footer?: ReactNode
}

/**
 * The web's lead-sources Dialog as a bottom sheet: title, description, close button, a scrolling body and a footer
 * row. It lifts above the keyboard, so a field in the body stays visible while typing.
 */
export default function Dialog({ open, onClose, title, description, children, footer }: Props) {
    return (
        <Sheet visible={open} onClose={onClose} accessibilityLabel={title} avoidKeyboard>
            <View className="flex-row items-start justify-between gap-3 px-5 pt-3">
                <View className="min-w-0 flex-1">
                    <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
                    {typeof description === "string" ? (
                        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</Text>
                    ) : (
                        description
                    )}
                </View>
                <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    hitSlop={10}
                    className="rounded-lg p-1 active:bg-neutral-100 dark:active:bg-neutral-800"
                >
                    <X size={20} color={PALETTE["neutral-400"]} />
                </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 px-5 py-4">
                {children}
            </ScrollView>

            {footer && (
                <View className="flex-row justify-end gap-2 border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
                    {footer}
                </View>
            )}
        </Sheet>
    )
}
