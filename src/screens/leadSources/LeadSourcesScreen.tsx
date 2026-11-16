import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FlatList, RefreshControl, View, useColorScheme, type LayoutChangeEvent } from "react-native"

import BulkBar, { type BulkDialog } from "@/components/leadSources/BulkBar"
import CallbackSheet from "@/components/leadSources/CallbackSheet"
import AssignSheet from "@/components/leadSources/bulk/AssignSheet"
import DaySheet from "@/components/leadSources/bulk/DaySheet"
import DeleteSheet from "@/components/leadSources/bulk/DeleteSheet"
import StatusSheet from "@/components/leadSources/bulk/StatusSheet"
import LeadSourceRow, { LeadSourceRowSkeleton } from "@/components/leadSources/LeadSourceRow"
import LeadSourcesEmpty from "@/components/leadSources/LeadSourcesEmpty"
import LeadSourcesHeader from "@/components/leadSources/LeadSourcesHeader"
import { buildListLayout, type ListItem } from "@/components/leadSources/listItems"
import ListSectionHeader from "@/components/leadSources/ListSectionHeader"
import StatusMenuSheet from "@/components/leadSources/StatusMenuSheet"
import { AccessDenied, OfflineNotice } from "@/components/ui"
import { canManageLeadSources } from "@/constants/leadSourceRoles"
import { useAuth } from "@/contexts/AuthContext"
import { useIsOnline } from "@/hooks/useIsOnline"
import { useLeadSourceList } from "@/hooks/useLeadSourceList"
import { useNow } from "@/hooks/useNow"
import { todayString } from "@/lib/leadSourceDay"
import { openLead } from "@/navigation/openRecord"
import type { CallsStackParamList } from "@/navigation/types"
import { BRAND_COLOR } from "@/theme"
import type { LeadSourceRow as Row } from "@/types/leadSource"

type Navigation = NativeStackNavigationProp<CallsStackParamList, "LeadSources">

const SKELETON_ROWS = 8
const NOW_TICK_MS = 15_000
// Room under the last row: the floating bulk bar while rows are selected, a small gap otherwise.
const CONTENT_WITH_BAR = { paddingBottom: 96 }
const CONTENT_PLAIN = { paddingBottom: 16 }

const SKELETON_KEYS = Array.from({ length: SKELETON_ROWS }, (_, i) => i)

function SkeletonRows() {
    return (
        <View>
            {SKELETON_KEYS.map((key) => (
                <LeadSourceRowSkeleton key={key} />
            ))}
        </View>
    )
}

/**
 * The Calls tab: the lead sources list. Today comes from the server already sorted, in three sections with sticky
 * headers. A tap on the badge logs the result of a call; a long press starts a selection for the bulk actions.
 * Ported from the web's LeadSourcesClient.tsx.
 */
export default function LeadSourcesScreen() {
    const navigation = useNavigation<Navigation>()
    const params = useRoute<RouteProp<CallsStackParamList, "LeadSources">>().params
    const { role } = useAuth()
    const isManager = canManageLeadSources(role)
    const isDarkMode = useColorScheme() === "dark"
    const isOnline = useIsOnline()
    const now = useNow(NOW_TICK_MS)
    const today = todayString()
    const listRef = useRef<FlatList<ListItem>>(null)
    const [headerHeight, setHeaderHeight] = useState(0)
    const [selected, setSelected] = useState<Set<string>>(() => new Set())
    const [dialog, setDialog] = useState<BulkDialog | null>(null)
    const [statusTarget, setStatusTarget] = useState<{ row: Row; status: number } | null>(null)
    const [callbackTarget, setCallbackTarget] = useState<Row | null>(null)

    // The quiet reload waits while the person is busy: a sheet open, or rows selected.
    const isBusy = selected.size > 0 || dialog !== null || statusTarget !== null || callbackTarget !== null
    const list = useLeadSourceList({ isPaused: isBusy })
    const view = list.filters.day ? "day" : list.filters.view
    const layout = useMemo(() => buildListLayout(list.rows, view, today), [list.rows, view, today])

    // A report's "Open the N imported sources" arrives with its own view and upload, and replaces the filters. The
    // params are then cleared, so the same link opened again later applies again.
    const { resetFilters } = list
    useEffect(() => {
        if (!params?.upload && !params?.view) return
        resetFilters({ view: params.view ?? "today", upload: params.upload ?? "" })
        navigation.setParams({ view: undefined, upload: undefined })
    }, [params?.view, params?.upload, resetFilters, navigation])

    // A new view or filter is a new list. A selection from the old one would point at rows no longer on screen.
    const filtersKey = JSON.stringify(list.filters)
    useEffect(() => {
        setSelected(new Set())
    }, [filtersKey])

    const toggle = useCallback((id: string) => {
        setSelected((current) => {
            const next = new Set(current)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])
    const openDetail = useCallback(
        (row: Row) => navigation.navigate("LeadSourceDetail", { sourceId: row._id }),
        [navigation],
    )
    const openStatus = useCallback((row: Row, status: number) => setStatusTarget({ row, status }), [])
    const openCallback = useCallback((row: Row) => setCallbackTarget(row), [])
    const openConvertedLead = useCallback((leadId: string) => openLead(leadId, role), [role])

    function showDue() {
        list.setFilters({ view: "today", day: "" })
        listRef.current?.scrollToOffset({ offset: 0, animated: true })
    }

    function afterBulk() {
        setSelected(new Set())
        list.reloadNow()
    }

    function handleHeaderLayout(event: LayoutChangeEvent) {
        setHeaderHeight(event.nativeEvent.layout.height)
    }

    if (!list.loading && list.accessError) {
        return (
            <View className="flex-1 justify-center p-4">
                <AccessDenied message={list.accessError} />
            </View>
        )
    }

    const isSelecting = selected.size > 0
    const selectedIds = [...selected]
    const selectedRegions = [...new Set(list.rows.filter((row) => selected.has(row._id)).map((row) => row.region))]
    const isFiltered = Boolean(
        list.filters.search || list.filters.status || list.filters.assignee || list.filters.day || list.filters.upload,
    )

    function renderItem({ item }: { item: ListItem }) {
        if (item.kind === "section") return <ListSectionHeader section={item.section} />
        return (
            <LeadSourceRow
                row={item.row}
                view={view}
                today={today}
                now={now}
                isSelected={selected.has(item.row._id)}
                isSelecting={isSelecting}
                showAssignee={isManager}
                onOpen={openDetail}
                onToggle={toggle}
                onOpenStatus={openStatus}
                onOpenCallback={openCallback}
                onOpenLead={openConvertedLead}
            />
        )
    }

    return (
        <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
            <FlatList
                ref={listRef}
                data={list.loading ? [] : layout.items}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                extraData={{ selected, now }}
                // Header indices count the list header as item 0, so each data index moves up by one.
                stickyHeaderIndices={list.loading ? undefined : layout.sectionIndices.map((index) => index + 1)}
                getItemLayout={(_data, index) => ({
                    length: layout.heights[index] ?? 0,
                    offset: headerHeight + (layout.offsets[index] ?? 0),
                    index,
                })}
                ListHeaderComponent={
                    <View onLayout={handleHeaderLayout}>
                        <LeadSourcesHeader
                            list={list}
                            isManager={isManager}
                            onShowDue={showDue}
                            onOpenUploads={() => navigation.navigate("LeadSourceUploads")}
                            onUploadSheet={() => navigation.navigate("LeadSourceUpload")}
                        />
                        {list.isShowingSaved && (list.isOffline || !isOnline) && (
                            <View className="px-3 pb-2">
                                <OfflineNotice />
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    list.loading ? (
                        <SkeletonRows />
                    ) : list.isOffline ? (
                        <OfflineNotice variant="empty" onRetry={list.refresh} />
                    ) : (
                        <LeadSourcesEmpty view={view} isManager={isManager} isFiltered={isFiltered} />
                    )
                }
                ListFooterComponent={list.loadingMore ? <LeadSourceRowSkeleton /> : undefined}
                onEndReached={list.loadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={list.refreshing}
                        onRefresh={list.refresh}
                        colors={[BRAND_COLOR.light]}
                        tintColor={isDarkMode ? BRAND_COLOR.dark : BRAND_COLOR.light}
                    />
                }
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={isSelecting ? CONTENT_WITH_BAR : CONTENT_PLAIN}
            />

            <BulkBar
                count={selected.size}
                isManager={isManager}
                onOpen={setDialog}
                onClear={() => setSelected(new Set())}
            />

            {dialog === "status" && (
                <StatusSheet open onClose={() => setDialog(null)} ids={selectedIds} onDone={afterBulk} />
            )}
            {dialog === "assign" && (
                <AssignSheet
                    open
                    onClose={() => setDialog(null)}
                    ids={selectedIds}
                    regions={selectedRegions}
                    onDone={afterBulk}
                />
            )}
            {dialog === "day" && <DaySheet open onClose={() => setDialog(null)} ids={selectedIds} onDone={afterBulk} />}
            {dialog === "delete" && (
                <DeleteSheet open onClose={() => setDialog(null)} ids={selectedIds} onDone={afterBulk} />
            )}

            <StatusMenuSheet
                row={statusTarget?.row ?? null}
                startStatus={statusTarget?.status ?? null}
                onClose={() => setStatusTarget(null)}
                onUpdated={list.onUpdated}
                onConflict={list.reloadNow}
            />
            <CallbackSheet source={callbackTarget} onClose={() => setCallbackTarget(null)} onUpdated={list.onUpdated} />
        </View>
    )
}
