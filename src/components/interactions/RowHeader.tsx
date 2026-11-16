import { Calendar, Pencil } from "lucide-react-native"
import type { ReactNode } from "react"
import { Pressable, Text, View } from "react-native"

import { TimeAgo } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"

interface Props {
    /** The title and badge, left. */
    children: ReactNode
    createdAt: string
    /** Shows the pencil. The web reveals it on hover; here it is always visible. */
    onEdit?: () => void
    editLabel?: string
}

enableIconClassNames(Calendar, Pencil)

/** A timeline row's first line: title and badge on the left, the time and the edit pencil on the right. */
export default function RowHeader({ children, createdAt, onEdit, editLabel = "Edit" }: Props) {
    return (
        <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">{children}</View>
            <View className="flex-row items-center gap-1">
                <Calendar size={12} className="text-gray-500" />
                <TimeAgo date={createdAt} className="text-xs" />
                {onEdit && (
                    <Pressable
                        onPress={onEdit}
                        accessibilityRole="button"
                        accessibilityLabel={editLabel}
                        className="-my-3 h-11 w-11 items-center justify-center"
                    >
                        <Pencil size={14} className="text-neutral-400" />
                    </Pressable>
                )}
            </View>
        </View>
    )
}

/** The bold row title the web's rows share. */
export function RowTitle({ children }: { children: ReactNode }) {
    return (
        <Text className="text-sm font-semibold capitalize tracking-wide text-neutral-800 dark:text-neutral-200">
            {children}
        </Text>
    )
}
