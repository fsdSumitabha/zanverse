import { Inbox, type LucideIcon } from "lucide-react-native"
import { Text, View, useColorScheme } from "react-native"

import { PALETTE } from "@/theme"

import Button from "./Button"

interface Props {
    icon?: LucideIcon
    title: string
    message?: string
    actionLabel?: string
    onAction?: () => void
}

const ICON_SIZE = 28

/** A list or a screen with nothing to show: an icon, a title, a line of help and an optional button. */
export default function EmptyState({ icon: Icon = Inbox, title, message, actionLabel, onAction }: Props) {
    const isDarkMode = useColorScheme() === "dark"

    return (
        <View className="items-center justify-center px-6 py-10">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Icon size={ICON_SIZE} color={isDarkMode ? PALETTE["neutral-400"] : PALETTE["neutral-500"]} />
            </View>
            <Text className="text-center text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
            {!!message && (
                <Text className="mt-1 max-w-sm text-center text-sm text-neutral-600 dark:text-neutral-400">
                    {message}
                </Text>
            )}
            {actionLabel && onAction && (
                <Button label={actionLabel} onPress={onAction} variant="primary" className="mt-5" />
            )}
        </View>
    )
}
