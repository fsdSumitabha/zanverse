import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { ArrowRight } from "lucide-react-native"
import { useState, type ReactNode } from "react"
import { Pressable, RefreshControl, ScrollView, Text, View, useColorScheme } from "react-native"

import { send } from "@/api/client"
import { LEAD_SOURCES_API } from "@/api/endpoints"
import ActivityTimeline from "@/components/leadSources/ActivityTimeline"
import AddNote from "@/components/leadSources/AddNote"
import AssignSheet from "@/components/leadSources/bulk/AssignSheet"
import DaySheet from "@/components/leadSources/bulk/DaySheet"
import DeleteSheet from "@/components/leadSources/bulk/DeleteSheet"
import CallbackSheet from "@/components/leadSources/CallbackSheet"
import ConvertSheet from "@/components/leadSources/ConvertSheet"
import ImportNotes from "@/components/leadSources/ImportNotes"
import LeadSourceHeaderCard, { type DetailPanel } from "@/components/leadSources/LeadSourceHeaderCard"
import SheetData from "@/components/leadSources/SheetData"
import StatusMenuSheet from "@/components/leadSources/StatusMenuSheet"
import { AccessDenied, Card, SkeletonBlock } from "@/components/ui"
import { LEAD_SOURCE_STATUS } from "@/constants/leadSourceStatus"
import { useAuth } from "@/contexts/AuthContext"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { useNow } from "@/hooks/useNow"
import { enableIconClassNames } from "@/lib/iconClassName"
import { notify } from "@/lib/notify"
import { openLead } from "@/navigation/openRecord"
import type { CallsStackParamList } from "@/navigation/types"
import { BRAND_COLOR } from "@/theme"
import type { LeadSourceDetail, LeadSourceRow } from "@/types/leadSource"

type Navigation = NativeStackNavigationProp<CallsStackParamList, "LeadSourceDetail">

const NOW_TICK_MS = 15_000
// The web's h-44, h-28 and h-56 placeholder cards.
const SKELETON_HEIGHTS = [176, 112, 224]

enableIconClassNames(ArrowRight)

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <Card className="p-4">
            <Text className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
            {children}
        </Card>
    )
}

/**
 * One lead source: the header card, the converted banner, "Add a note", the upload warnings, "From the sheet" and
 * the activity. Ported from the web's lead-sources/[sourceId]/page.tsx.
 */
export default function LeadSourceDetailScreen() {
    const navigation = useNavigation<Navigation>()
    const { sourceId } = useRoute<RouteProp<CallsStackParamList, "LeadSourceDetail">>().params
    const { role } = useAuth()
    const isDarkMode = useColorScheme() === "dark"
    const now = useNow(NOW_TICK_MS)
    const detail = useDetailQuery<LeadSourceDetail>(`${LEAD_SOURCES_API}/${sourceId}`)
    const [panel, setPanel] = useState<DetailPanel | null>(null)
    const [isConverting, setIsConverting] = useState(false)
    const source = detail.data

    // A change from a sheet answers with the list row. Put it on screen at once, then reload for the new activity.
    function handleUpdated(row: LeadSourceRow) {
        detail.setData((current) => (current ? { ...current, ...row } : current))
        detail.refetch()
    }

    async function convert() {
        setIsConverting(true)
        try {
            const { leadId } = await send<{ leadId: string }>(`${LEAD_SOURCES_API}/${sourceId}/convert`, "POST", {})
            notify.success("Lead created")
            setPanel(null)
            setIsConverting(false)
            detail.refetch()
            openLead(leadId, role)
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to convert")
            setIsConverting(false)
            setPanel(null)
        }
    }

    if (!detail.loading && detail.accessError) {
        return (
            <View className="flex-1 justify-center p-4">
                <AccessDenied message={detail.accessError} />
            </View>
        )
    }

    if (detail.loading) {
        return (
            <View accessibilityLabel="Loading" className="gap-3 p-3">
                {SKELETON_HEIGHTS.map((height) => (
                    <SkeletonBlock key={height} width="100%" height={height} rounded="lg" />
                ))}
            </View>
        )
    }

    if (!source) {
        return (
            <View className="p-3">
                <Card className="items-center px-4 py-12">
                    <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        Lead source not found
                    </Text>
                    <Text className="mt-1 text-center text-sm text-neutral-500">
                        It may have been deleted, or it is assigned to someone else.
                    </Text>
                </Card>
            </View>
        )
    }

    const isConverted = source.status === LEAD_SOURCE_STATUS.CONVERTED
    const ids = [source._id]
    const closePanel = () => setPanel(null)

    return (
        <>
            <ScrollView
                contentContainerClassName="gap-3 p-3 pb-10"
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={detail.refreshing}
                        onRefresh={detail.refresh}
                        colors={[BRAND_COLOR.light]}
                        tintColor={isDarkMode ? BRAND_COLOR.dark : BRAND_COLOR.light}
                    />
                }
            >
                <LeadSourceHeaderCard
                    source={source}
                    now={now}
                    onOpen={setPanel}
                    onOpenUpload={(uploadId) => navigation.navigate("LeadSourceReport", { uploadId })}
                />

                {source.convertedLead && (
                    <View className="gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-500/10">
                        <Text className="text-sm text-blue-900 dark:text-blue-100">
                            This source is now a lead. Keep working on it there.
                        </Text>
                        <Pressable
                            onPress={() => source.convertedLead && openLead(source.convertedLead._id, role)}
                            accessibilityRole="link"
                            className="min-h-[44px] flex-row items-center gap-1.5 self-start"
                        >
                            <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                Open {source.convertedLead.name}
                            </Text>
                            <ArrowRight size={16} className="text-blue-700 dark:text-blue-300" />
                        </Pressable>
                    </View>
                )}

                {!isConverted && (
                    <Section title="Add a note">
                        <AddNote sourceId={source._id} onAdded={handleUpdated} />
                    </Section>
                )}

                <ImportNotes notes={source.importNotes} />

                <Section title="From the sheet">
                    <SheetData data={source.data} />
                </Section>

                <Section title="Activity">
                    <ActivityTimeline items={source.activity} />
                </Section>
            </ScrollView>

            <StatusMenuSheet
                row={panel === "status" ? source : null}
                startStatus={null}
                onClose={closePanel}
                onUpdated={handleUpdated}
                onConflict={detail.refetch}
            />
            <CallbackSheet
                source={panel === "callback" ? source : null}
                onClose={closePanel}
                onUpdated={handleUpdated}
            />
            {panel === "assign" && (
                <AssignSheet open onClose={closePanel} ids={ids} regions={[source.region]} onDone={detail.refetch} />
            )}
            {panel === "day" && <DaySheet open onClose={closePanel} ids={ids} onDone={detail.refetch} />}
            {panel === "delete" && (
                <DeleteSheet open onClose={closePanel} ids={ids} onDone={() => navigation.popTo("LeadSources")} />
            )}
            {panel === "convert" && (
                <ConvertSheet
                    name={source.name}
                    assigneeName={source.assignee?.name ?? null}
                    isConverting={isConverting}
                    onClose={closePanel}
                    onConfirm={convert}
                />
            )}
        </>
    )
}
