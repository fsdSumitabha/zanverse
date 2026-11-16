import { ChevronDown, ChevronRight, History } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import { TimeAgo } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"

import type { EditEntry, TimelinePerson } from "./timelineTypes"

interface Props {
    history?: EditEntry[]
    createdBy?: TimelinePerson
    createdAt?: string
}

enableIconClassNames(ChevronDown, ChevronRight, History)

// Verbatim from the web's EditHistory.tsx.
function personName(p: TimelinePerson): string {
    if (!p) return "Someone"
    if (typeof p === "string") return "User"
    return p.name || p.email || "User"
}

// Verbatim from the web's EditHistory.tsx.
function formatEditCount(count: number): string {
    switch (count) {
        case 1:
            return "once"
        case 2:
            return "twice"
        case 3:
            return "thrice"
        default:
            return `${count} times`
    }
}

const ENTRY_CLASSES = "border-l border-neutral-200 pl-3 dark:border-neutral-800"
const ENTRY_TEXT = "text-[11px] text-neutral-500 dark:text-neutral-500"

/** Who edited a note or remarks, and the earlier values. Ported from the web's EditHistory.tsx. */
export default function EditHistory({ history, createdBy, createdAt }: Props) {
    const [open, setOpen] = useState(false)

    if (!history || history.length === 0) return null

    // Most recent first; every entry carries the value it had *before* that edit.
    const entries = [...history].reverse()
    const latest = entries[0]

    return (
        <View className="mt-3 border-t border-neutral-200 pt-2 dark:border-neutral-800">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
                <View className="flex-row flex-wrap items-center gap-1.5">
                    <History size={12} className="text-neutral-700 dark:text-neutral-300" />
                    <Text className="text-[11px] text-neutral-700 dark:text-neutral-300">
                        Edited by <Text className="font-medium">{personName(latest.editedBy)}</Text>{" "}
                    </Text>
                    <TimeAgo date={latest.editedAt} className="text-[11px]" />
                </View>

                <Pressable
                    onPress={() => setOpen((value) => !value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edited ${formatEditCount(entries.length)}. ${
                        open ? "Hide history" : "Show history"
                    }`}
                    accessibilityState={{ expanded: open }}
                    className="min-h-[44px] flex-row items-center gap-1"
                >
                    <Text className="text-[10px] font-medium text-neutral-500">
                        Edited {formatEditCount(entries.length)}
                    </Text>
                    {open ? (
                        <ChevronDown size={12} className="text-neutral-500" />
                    ) : (
                        <ChevronRight size={12} className="text-neutral-500" />
                    )}
                    <Text className="text-[10px] text-neutral-500">{open ? "Hide history" : "Show history"}</Text>
                </Pressable>
            </View>

            {open && (
                <View className="mt-2 gap-2">
                    {entries.map((entry, index) => (
                        <View key={index} className={ENTRY_CLASSES}>
                            <View className="flex-row items-center gap-1">
                                <Text className={ENTRY_TEXT}>{personName(entry.editedBy)} ·</Text>
                                <TimeAgo date={entry.editedAt} className="text-[11px]" />
                            </View>
                            {(entry.oldTitle !== undefined || entry.oldDescription !== undefined) && (
                                <View className="mt-1 gap-0.5">
                                    <Text className={`${ENTRY_TEXT} opacity-60`}>Previous value:</Text>
                                    {entry.oldTitle !== undefined && (
                                        <Text numberOfLines={2} className={ENTRY_TEXT}>
                                            <Text className="opacity-60">title:</Text> {entry.oldTitle || "empty"}
                                        </Text>
                                    )}
                                    {entry.oldDescription !== undefined && (
                                        <Text numberOfLines={3} className={ENTRY_TEXT}>
                                            <Text className="opacity-60">description:</Text>{" "}
                                            {entry.oldDescription || "empty"}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    ))}

                    {!!createdBy && (
                        <View className={`${ENTRY_CLASSES} flex-row flex-wrap items-center gap-1`}>
                            <Text className={ENTRY_TEXT}>
                                Created by <Text className="font-medium">{personName(createdBy)}</Text>
                                {createdAt ? " ·" : ""}
                            </Text>
                            {!!createdAt && <TimeAgo date={createdAt} className="text-[11px]" />}
                        </View>
                    )}
                </View>
            )}
        </View>
    )
}
