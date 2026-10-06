import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Download, Upload } from "lucide-react-native"
import { useEffect, useRef, useState } from "react"
import { Pressable, Text, View } from "react-native"

import { ApiError } from "@/api/client"
import { LEAD_SOURCE_TEMPLATE_API } from "@/api/endpoints"
import AssigneeSelect from "@/components/leadSources/AssigneeSelect"
import DayChoice from "@/components/leadSources/DayChoice"
import FilePickRow from "@/components/leadSources/FilePickRow"
import SheetHeaderChips from "@/components/leadSources/SheetHeaderChips"
import UploadProblem, { type HeaderProblem } from "@/components/leadSources/UploadProblem"
import WriteRegionField from "@/components/region/WriteRegionField"
import { Button, Card, Field, FormScrollView } from "@/components/ui"
import { useSheetColumns } from "@/hooks/useSheetColumns"
import { useWriteRegion } from "@/hooks/useWriteRegion"
import { downloadXlsx } from "@/lib/downloadFile"
import { enableIconClassNames } from "@/lib/iconClassName"
import { pickSheetFile, uploadSheet, type PickedSheet } from "@/lib/leadSourceUpload"
import { notify } from "@/lib/notify"
import type { CallsStackParamList } from "@/navigation/types"
import { useOfflineReason } from "@/hooks/useIsOnline"

type Navigation = NativeStackNavigationProp<CallsStackParamList, "LeadSourceUpload">

enableIconClassNames(Download)

function getProgressStyle(share: number) {
    return { width: `${Math.round(share * 100)}%` as const }
}

/**
 * Upload a cold-calling sheet: pick the file, choose who calls and when, watch the upload, land on the report.
 * Ported from the web's UploadForm.tsx, with the dropzone replaced by the system file picker.
 */
export default function LeadSourceUploadScreen() {
    const offlineReason = useOfflineReason()
    const navigation = useNavigation<Navigation>()
    const region = useWriteRegion()
    const sheet = useSheetColumns()
    const [file, setFile] = useState<PickedSheet | null>(null)
    const [assignee, setAssignee] = useState("")
    const [day, setDay] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [rejection, setRejection] = useState<string | null>(null)
    const [problem, setProblem] = useState<HeaderProblem | null>(null)

    // The back button, or the header's, cannot leave while the upload is in flight. A ref, not the state, so the
    // replace to the report right after the upload is not blocked by a listener from the render before.
    const isUploadingRef = useRef(false)
    useEffect(
        () =>
            navigation.addListener("beforeRemove", (event) => {
                if (isUploadingRef.current) event.preventDefault()
            }),
        [navigation],
    )

    async function choose() {
        try {
            const picked = await pickSheetFile(sheet.rules.maxFileMb)
            if (!picked) return
            setFile(picked)
            setRejection(null)
            setProblem(null)
        } catch (error) {
            setRejection(error instanceof Error ? error.message : "Could not open the file")
        }
    }

    function clear() {
        setFile(null)
        setRejection(null)
        setProblem(null)
    }

    async function submit() {
        if (!file || isUploading) return
        isUploadingRef.current = true
        setIsUploading(true)
        setProgress(0)
        setProblem(null)
        try {
            const result = await uploadSheet({
                file,
                region: region.value,
                assignedTo: assignee,
                allottedDay: day,
                onProgress: setProgress,
            })
            const { imported, skipped } = result.counts
            notify.success(`${imported} imported${skipped ? `, ${skipped} skipped` : ""}.`)
            isUploadingRef.current = false
            navigation.replace("LeadSourceReport", { uploadId: result.uploadId })
        } catch (error) {
            const details = error instanceof ApiError ? (error.details as Omit<HeaderProblem, "message">) : undefined
            setProblem({
                message: error instanceof Error ? error.message : "The upload failed.",
                missing: details?.missing,
                found: details?.found,
            })
            isUploadingRef.current = false
            setIsUploading(false)
        }
    }

    return (
        <FormScrollView>
            <View>
                <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Upload a sheet</Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    Every row is checked. Good rows become lead sources. You get a report of every row, and why any was
                    skipped.
                </Text>
            </View>

            <Card className="gap-3 p-4">
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">1. The sheet</Text>
                    <Pressable
                        onPress={() => downloadXlsx(LEAD_SOURCE_TEMPLATE_API, "lead-source-template.xlsx")}
                        accessibilityRole="button"
                        className="min-h-[44px] flex-row items-center gap-1.5 rounded-lg px-2.5 active:bg-blue-50 dark:active:bg-blue-500/10"
                    >
                        <Download size={16} className="text-blue-600 dark:text-blue-400" />
                        <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">Download template</Text>
                    </Pressable>
                </View>
                <FilePickRow
                    file={file}
                    maxFileMb={sheet.rules.maxFileMb}
                    maxRows={sheet.rules.maxRows}
                    disabled={isUploading}
                    onPick={choose}
                    onClear={clear}
                />
                {!!rejection && <Text className="text-sm text-rose-600">{rejection}</Text>}
                {!sheet.isLoading && <SheetHeaderChips columns={sheet.columns} />}
            </Card>

            <Card className="gap-4 p-4">
                <View>
                    <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        2. Who calls them, and when
                    </Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        Both are optional. You can assign and set days later from the list, on any number of rows at
                        once.
                    </Text>
                </View>
                <View pointerEvents={isUploading ? "none" : "auto"} className="gap-4">
                    <WriteRegionField region={region} />
                    {region.value ? (
                        <AssigneeSelect
                            label="Assign every row to"
                            regions={[region.value]}
                            value={assignee}
                            onChange={setAssignee}
                        />
                    ) : (
                        <Text className="text-sm text-neutral-400">Loading...</Text>
                    )}
                    <Field label="Day to call them">
                        <DayChoice value={day} onChange={setDay} noneLabel="No day yet" />
                    </Field>
                </View>
            </Card>

            {problem && <UploadProblem problem={problem} />}

            {isUploading && (
                <View className="gap-1.5">
                    <View className="flex-row items-center gap-3">
                        <View className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-800">
                            <View className="h-full rounded-full bg-blue-600" style={getProgressStyle(progress)} />
                        </View>
                        <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                            {Math.round(progress * 100)}%
                        </Text>
                    </View>
                    <Text className="text-xs text-neutral-500">Stay on this screen until the upload finishes.</Text>
                </View>
            )}

            <View className="flex-row items-center justify-end gap-2">
                <Button label="Cancel" variant="quiet" onPress={() => navigation.goBack()} disabled={isUploading} />
                <Button
                    disabledReason={offlineReason}
                    testID="uploadSubmit"
                    label={isUploading ? "Checking and importing..." : "Upload and check"}
                    icon={Upload}
                    onPress={submit}
                    disabled={!file || isUploading || !region.value}
                />
            </View>
        </FormScrollView>
    )
}
