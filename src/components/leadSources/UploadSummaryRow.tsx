import { FileSpreadsheet } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { RegionBadge } from "@/components/region/RegionBadges"
import { TimeAgo } from "@/components/ui"
import { UPLOAD_STATUS } from "@/constants/leadSourceStatus"
import { enableIconClassNames } from "@/lib/iconClassName"
import { formatDay } from "@/lib/leadSourceDay"
import type { LeadSourceUploadSummary } from "@/types/leadSource"

enableIconClassNames(FileSpreadsheet)

/** One past upload: file, region, who and when, and the three counters. Ported from a row of the web's Uploads list. */
export default function UploadSummaryRow({
    upload,
    onPress,
}: {
    upload: LeadSourceUploadSummary
    onPress: () => void
}) {
    const { imported, warned, skipped } = upload.counts
    const extras = [
        upload.assignedTo?.name ? `for ${upload.assignedTo.name}` : null,
        upload.allottedDay ? formatDay(upload.allottedDay) : null,
    ].filter(Boolean)

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={upload.fileName}
            className="flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 active:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
        >
            <FileSpreadsheet size={20} className="text-emerald-600" />
            <View className="min-w-0 flex-1 gap-1">
                <View className="min-w-0 flex-row items-center gap-2">
                    <Text
                        numberOfLines={1}
                        className="flex-shrink text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                        {upload.fileName}
                    </Text>
                    <RegionBadge code={upload.region} />
                    {upload.status === UPLOAD_STATUS.FAILED && (
                        <Text className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                            Failed
                        </Text>
                    )}
                </View>
                <View className="flex-row flex-wrap items-center gap-x-1">
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {upload.uploadedBy?.name || "Someone"} ·
                    </Text>
                    <TimeAgo date={upload.createdAt} className="text-xs text-neutral-500 dark:text-neutral-400" />
                    {extras.length > 0 && (
                        <Text numberOfLines={1} className="text-xs text-neutral-500 dark:text-neutral-400">
                            · {extras.join(" · ")}
                        </Text>
                    )}
                </View>
                <View className="flex-row flex-wrap gap-3">
                    <Text className="text-xs text-emerald-700 dark:text-emerald-400">{imported} imported</Text>
                    {warned > 0 && (
                        <Text className="text-xs text-amber-700 dark:text-amber-400">{warned} warnings</Text>
                    )}
                    <Text className={skipped ? "text-xs text-rose-700 dark:text-rose-400" : "text-xs text-neutral-400"}>
                        {skipped} skipped
                    </Text>
                </View>
            </View>
        </Pressable>
    )
}

/** A row while the list loads. */
export function UploadSummarySkeleton() {
    return <View className="h-20 rounded-xl bg-slate-100 dark:bg-neutral-800/40" />
}
