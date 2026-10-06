import { CalendarClock } from "lucide-react-native"
import { Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"
import { formatDateTime } from "@/lib/format"
import type { Meeting } from "@/types/meeting"

enableIconClassNames(CalendarClock)

/** Every earlier time of a meeting, struck through, with the reason; the most recent last. Ported from MeetingCard. */
export default function RescheduleHistory({ history }: { history: Meeting["rescheduleHistory"] }) {
    if (!Array.isArray(history) || history.length === 0) return null

    return (
        <View className="gap-2 rounded-md border border-amber-200 bg-amber-50/70 p-2.5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <View className="flex-row items-center gap-1.5">
                <CalendarClock size={12} className="text-amber-700 dark:text-amber-300" />
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Rescheduled
                </Text>
                <Text className="text-[11px] text-amber-600/80 dark:text-amber-400/80">({history.length})</Text>
            </View>
            {history.map((entry, index) => (
                <View key={`${entry.changedAt}-${index}`} className="flex-row flex-wrap items-center gap-1.5">
                    <Text className="text-xs text-neutral-500 line-through">
                        {formatDateTime(entry.oldDate) || "—"}
                    </Text>
                    {!!entry.reason && (
                        <Text className="text-xs italic text-neutral-600 dark:text-neutral-500">
                            | “{entry.reason}”
                        </Text>
                    )}
                </View>
            ))}
        </View>
    )
}
