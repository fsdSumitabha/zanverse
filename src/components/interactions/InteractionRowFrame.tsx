import clsx from "clsx"
import type { LucideIcon } from "lucide-react-native"
import type { ReactNode } from "react"
import { View } from "react-native"

import { InlineValue } from "@/components/ui"

interface Props {
    icon: LucideIcon
    /** The icon box's classes. The web's default is the grey box. */
    iconBoxClassName?: string
    /** The icon's colour classes. */
    iconClassName?: string
    createdBy?: { name?: string } | null
    children: ReactNode
}

// The card every timeline row shares, as the web's row components write it.
const ROW_CLASSES =
    "flex-row gap-3 rounded-lg border border-neutral-800 bg-white p-4 dark:rounded-xl dark:bg-neutral-900"

/**
 * A timeline row: the icon box on the left, the row's content on the right, and "Created by" as a visible last line
 * (the web's hover tooltip).
 */
export default function InteractionRowFrame({
    icon: Icon,
    iconBoxClassName = "bg-neutral-100 dark:bg-neutral-800",
    iconClassName = "text-neutral-600 dark:text-neutral-300",
    createdBy,
    children,
}: Props) {
    return (
        <View className={ROW_CLASSES}>
            <View className="mt-1">
                <View className={clsx("rounded-lg p-2", iconBoxClassName)}>
                    <Icon size={16} className={iconClassName} />
                </View>
            </View>
            <View className="min-w-0 flex-1 gap-2">
                {children}
                {!!createdBy?.name && <InlineValue value={`Created by ${createdBy.name}`} />}
            </View>
        </View>
    )
}
