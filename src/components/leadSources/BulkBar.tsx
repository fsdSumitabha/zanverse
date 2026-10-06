import { CalendarDays, ListChecks, Trash2, UserRoundPlus, X, type LucideIcon } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"

export type BulkDialog = "status" | "assign" | "day" | "delete"

interface Props {
    count: number
    isManager: boolean
    onOpen: (dialog: BulkDialog) => void
    onClear: () => void
}

// The bar's gap above the bottom of the screen. A tab screen already ends at the tab bar's top edge, and the tab
// bar's height already includes the gesture-bar inset (session 1 finding), so no inset is added here.
const BAR_STYLE = { bottom: 16 }
// The web's shadow-2xl, as Android elevation.
const BAR_SHADOW = { elevation: 12 }
const ICON_SIZE = 18
const BUTTON_TONE = "text-white/90"
const DANGER_TONE = "text-rose-300"

enableIconClassNames(CalendarDays, ListChecks, Trash2, UserRoundPlus, X)

function BarButton({
    icon: Icon,
    label,
    tone = BUTTON_TONE,
    onPress,
}: {
    icon: LucideIcon
    label: string
    tone?: string
    onPress: () => void
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            className="h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
        >
            <Icon size={ICON_SIZE} className={tone} />
        </Pressable>
    )
}

/**
 * Actions for the selected rows, floating above the tab bar while at least one row is selected. Everyone can set a
 * status on several rows; assigning, moving to a day and deleting are for managers. Ported from the web's BulkBar.tsx.
 * As on the web at phone width, the buttons show icons only; each carries its label for screen readers.
 */
export default function BulkBar({ count, isManager, onOpen, onClear }: Props) {
    if (count === 0) return null

    return (
        <View pointerEvents="box-none" className="absolute inset-x-0 items-center px-3" style={BAR_STYLE}>
            <View
                accessibilityRole="toolbar"
                accessibilityLabel="Actions for the selected lead sources"
                className="max-w-full flex-row items-center gap-0.5 rounded-2xl bg-neutral-900 px-1.5 py-1 dark:bg-neutral-800"
                style={BAR_SHADOW}
            >
                <Pressable
                    onPress={onClear}
                    accessibilityRole="button"
                    accessibilityLabel="Clear the selection"
                    className="h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
                >
                    <X size={ICON_SIZE} className="text-white/70" />
                </Pressable>
                <Text className="px-1 text-sm font-semibold text-white">{count} selected</Text>
                <View className="mx-1 h-5 w-px bg-white/20" />
                <BarButton icon={ListChecks} label="Status" onPress={() => onOpen("status")} />
                {isManager && (
                    <>
                        <BarButton icon={UserRoundPlus} label="Assign" onPress={() => onOpen("assign")} />
                        <BarButton icon={CalendarDays} label="Day" onPress={() => onOpen("day")} />
                        <BarButton icon={Trash2} label="Delete" tone={DANGER_TONE} onPress={() => onOpen("delete")} />
                    </>
                )}
            </View>
        </View>
    )
}
