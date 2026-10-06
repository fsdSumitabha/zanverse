import clsx from "clsx"
import { ArrowRight, Download, Info, TriangleAlert } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { LEAD_SOURCE_UPLOADS_API } from "@/api/endpoints"
import { RegionBadge } from "@/components/region/RegionBadges"
import { Card } from "@/components/ui"
import { UPLOAD_STATUS } from "@/constants/leadSourceStatus"
import { downloadXlsx } from "@/lib/downloadFile"
import { formatDateTime } from "@/lib/format"
import { enableIconClassNames } from "@/lib/iconClassName"
import { formatDay } from "@/lib/leadSourceDay"
import type { LeadSourceUploadReport } from "@/types/leadSource"

interface Props {
    report: LeadSourceUploadReport
    onOpenImported: () => void
}

enableIconClassNames(ArrowRight, Download, Info, TriangleAlert)

function NoteLine({ text }: { text: string }) {
    return (
        <View className="flex-row items-start gap-2">
            <Info size={16} className="mt-0.5 text-blue-500" />
            <Text className="flex-1 text-sm text-neutral-600 dark:text-neutral-300">{text}</Text>
        </View>
    )
}

/**
 * The report's header: file, who and when, the two downloads, the four count tiles, the failure, the file notes and
 * the link to the imported sources. Ported from the top card of the web's uploads/[uploadId]/page.tsx.
 */
export default function ReportHeaderCard({ report, onOpenImported }: Props) {
    const base = report.fileName.replace(/\.(xlsx|csv)$/i, "")
    const download = `${LEAD_SOURCE_UPLOADS_API}/${report._id}/download`
    const tiles = [
        { label: "Rows read", value: report.counts.read, tone: "text-neutral-900 dark:text-neutral-100" },
        { label: "Imported", value: report.counts.imported, tone: "text-emerald-700 dark:text-emerald-400" },
        { label: "With warnings", value: report.counts.warned, tone: "text-amber-700 dark:text-amber-400" },
        { label: "Skipped", value: report.counts.skipped, tone: "text-rose-700 dark:text-rose-400" },
    ]

    return (
        <Card className="gap-3 p-4">
            <View className="gap-0.5">
                <View className="flex-row items-center gap-2">
                    <Text
                        numberOfLines={1}
                        className="flex-shrink text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                        {report.fileName}
                    </Text>
                    <RegionBadge code={report.region} />
                </View>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    {report.uploadedBy?.name || "Someone"} · {formatDateTime(report.createdAt)}
                    {report.sheetName && report.sheetName !== "CSV" ? ` · sheet “${report.sheetName}”` : ""}
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    {report.assignedTo?.name ? `For ${report.assignedTo.name}` : "Not assigned"} ·{" "}
                    {report.allottedDay ? formatDay(report.allottedDay) : "no day"}
                </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
                <Pressable
                    onPress={() => downloadXlsx(download, `${base}-report.xlsx`)}
                    accessibilityRole="button"
                    className="min-h-[44px] flex-row items-center gap-1.5 rounded-lg bg-emerald-600 px-3 active:bg-emerald-500"
                >
                    <Download size={16} className="text-white" />
                    <Text className="text-sm font-medium text-white">Download report</Text>
                </Pressable>
                {report.counts.skipped > 0 && (
                    <Pressable
                        onPress={() => downloadXlsx(`${download}?only=skipped`, `${base}-report-skipped.xlsx`)}
                        accessibilityRole="button"
                        accessibilityHint="Fix these rows in Excel, then upload the same file again"
                        className="min-h-[44px] flex-row items-center gap-1.5 rounded-lg border border-slate-300 px-3 active:bg-slate-100 dark:border-neutral-700 dark:active:bg-neutral-800"
                    >
                        <Download size={16} className="text-neutral-700 dark:text-neutral-200" />
                        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                            Skipped rows only
                        </Text>
                    </Pressable>
                )}
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-2">
                {tiles.map((tile) => (
                    <View
                        key={tile.label}
                        className="w-[49%] rounded-lg border border-slate-200 px-3 py-2 dark:border-neutral-800"
                    >
                        <Text className="text-[11px] uppercase tracking-wide text-neutral-500">{tile.label}</Text>
                        <Text className={clsx("text-2xl font-semibold", tile.tone)}>{tile.value}</Text>
                    </View>
                ))}
            </View>

            {report.status === UPLOAD_STATUS.FAILED && (
                <View className="flex-row items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-500/10">
                    <TriangleAlert size={16} className="text-rose-800 dark:text-rose-200" />
                    <Text className="flex-1 text-sm text-rose-800 dark:text-rose-200">
                        {report.error || "This upload failed. Nothing was imported."}
                    </Text>
                </View>
            )}

            {(report.fileNotes.length > 0 || report.missingColumns.length > 0) && (
                <View className="gap-1">
                    {report.fileNotes.map((note) => (
                        <NoteLine key={note} text={note} />
                    ))}
                    {report.missingColumns.length > 0 && (
                        <NoteLine text={`Not in this file, so left empty: ${report.missingColumns.join(", ")}.`} />
                    )}
                </View>
            )}

            {report.counts.imported > 0 && (
                <Pressable
                    onPress={onOpenImported}
                    accessibilityRole="link"
                    className="min-h-[44px] flex-row items-center gap-1.5 self-start"
                >
                    <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {`Open the ${report.counts.imported} imported sources`}
                    </Text>
                    <ArrowRight size={16} className="text-blue-600 dark:text-blue-400" />
                </Pressable>
            )}
        </Card>
    )
}
