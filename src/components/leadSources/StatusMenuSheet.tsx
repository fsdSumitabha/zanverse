import clsx from "clsx"
import { ChevronDown } from "lucide-react-native"
import { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"

import { ApiError, send } from "@/api/client"
import { LEAD_SOURCES_API } from "@/api/endpoints"
import { Button, Sheet } from "@/components/ui"
import { SheetScrollView } from "@/components/ui/sheetScrollables"
import {
    LEAD_SOURCE_PICKABLE_STATUSES,
    LEAD_SOURCE_STATUS,
    LEAD_SOURCE_STATUS_META,
    type LeadSourceStatus,
} from "@/constants/leadSourceStatus"
import { useOfflineReason } from "@/hooks/useIsOnline"
import { callbackPayload, formatCallback } from "@/lib/callback"
import { enableIconClassNames } from "@/lib/iconClassName"
import { todayString } from "@/lib/leadSourceDay"
import { toNativeClasses } from "@/lib/nativeClasses"
import { notify } from "@/lib/notify"
import { scheduleCallbackReminder } from "@/lib/push/reminders"
import type { LeadSourceRow } from "@/types/leadSource"

import CallbackPicker, { EMPTY_CHOICE, resolveChoice, type CallbackChoice } from "./CallbackPicker"
import NoteBox from "./NoteBox"

const UNKNOWN_META = { label: "Unknown", color: "bg-gray-500 text-white" }
const HTTP_CONFLICT = 409
const BADGE_SIZE = { sm: "rounded-md px-2 py-1 text-[11px]", md: "rounded-lg px-3 py-2 text-sm" }

enableIconClassNames(ChevronDown)

/** The status as a badge that opens the sheet. Read-only, reading "Converted to a lead", once converted. */
export function StatusBadgeButton({
    status,
    onPress,
    disabled = false,
    size = "sm",
}: {
    status: number
    onPress: () => void
    disabled?: boolean
    /** "sm" on a row, "md" on the details screen. */
    size?: "sm" | "md"
}) {
    // A retired code, such as 60, shows a grey Unknown badge instead of crashing.
    const meta = LEAD_SOURCE_STATUS_META[status as LeadSourceStatus] ?? UNKNOWN_META
    const isConverted = status === LEAD_SOURCE_STATUS.CONVERTED
    const isLocked = disabled || isConverted
    const classes = toNativeClasses(`${BADGE_SIZE[size]} font-semibold ${meta.color}`)

    return (
        <Pressable
            onPress={onPress}
            disabled={isLocked}
            hitSlop={8}
            testID="statusMenuTrigger"
            accessibilityRole="button"
            accessibilityLabel={isConverted ? "Converted to a lead" : `Status: ${meta.label}. Press to change.`}
            accessibilityState={{ disabled: isLocked }}
            className={clsx("flex-row items-center gap-1", classes.container)}
        >
            <Text numberOfLines={1} className={classes.text}>
                {meta.label}
            </Text>
            {!isLocked && <ChevronDown size={size === "sm" ? 12 : 16} className={classes.text} />}
        </Pressable>
    )
}

interface Props {
    /** The row whose status is being set, or null when the sheet is closed. */
    row: LeadSourceRow | null
    /** The status picked when the sheet opens, such as Call Back from the callback chip. */
    startStatus: number | null
    onClose: () => void
    onUpdated: (row: LeadSourceRow) => void
    /** A 409 means the row changed underneath. The list reloads; the sheet stays open with the note. */
    onConflict: () => void
}

/**
 * The result of a call in one step: the status, a note and, for Call Back, when. Ported from the web's StatusMenu.tsx.
 * Save sends `PATCH /:id/status` with today's local day.
 */
export default function StatusMenuSheet({ row, startStatus, onClose, onUpdated, onConflict }: Props) {
    const offlineReason = useOfflineReason()
    const [picked, setPicked] = useState<number>(LEAD_SOURCE_STATUS.NEW)
    const [note, setNote] = useState("")
    const [choice, setChoice] = useState<CallbackChoice>(EMPTY_CHOICE)
    const [saving, setSaving] = useState(false)
    const [conflict, setConflict] = useState<string | null>(null)

    // A fresh start every time the sheet opens for a row.
    useEffect(() => {
        if (!row) return
        setPicked(startStatus ?? row.status)
        setNote("")
        setChoice(EMPTY_CHOICE)
        setConflict(null)
    }, [row, startStatus])

    const status = row?.status ?? LEAD_SOURCE_STATUS.NEW
    const isCallBack = picked === LEAD_SOURCE_STATUS.CALL_BACK
    const hasTime = !!resolveChoice(choice)
    const changed = picked !== status || note.trim() !== "" || isCallBack
    const canSave = !saving && changed && (!isCallBack || hasTime)

    async function save() {
        if (!row || !canSave) return
        const at = isCallBack ? resolveChoice(choice) : null
        setSaving(true)
        try {
            const updated = await send<LeadSourceRow>(`${LEAD_SOURCES_API}/${row._id}/status`, "PATCH", {
                status: picked,
                note: note.trim() || undefined,
                today: todayString(),
                ...(at ? callbackPayload(at) : {}),
            })
            // Call Back sets the phone's reminder (and asks for the permission the first time); any other status
            // clears callbackAt on the server, so the reminder goes.
            scheduleCallbackReminder(updated, { askPermission: isCallBack })
            onUpdated(updated)
            notify.success(
                updated.callbackAt && isCallBack
                    ? `Callback set for ${formatCallback(updated.callbackAt)}`
                    : `${row.name}: ${LEAD_SOURCE_STATUS_META[picked as LeadSourceStatus]?.label ?? ""}`,
            )
            onClose()
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update the status"
            if (error instanceof ApiError && error.status === HTTP_CONFLICT) {
                setConflict(message)
                onConflict()
            }
            notify.error(message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet visible={row !== null} onClose={onClose} accessibilityLabel={row ? `Status of ${row.name}` : "Status"}>
            <SheetScrollView contentContainerClassName="gap-3 px-5 pb-4 pt-3" keyboardShouldPersistTaps="handled">
                <View className="flex-row items-baseline justify-between gap-2">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Result of the call
                    </Text>
                    <Text numberOfLines={1} className="flex-shrink text-xs text-neutral-400">
                        {row?.name}
                    </Text>
                </View>

                <View className="flex-row flex-wrap justify-between gap-y-1.5" accessibilityRole="radiogroup">
                    {LEAD_SOURCE_PICKABLE_STATUSES.map((option) => {
                        const meta = LEAD_SOURCE_STATUS_META[option]
                        const isActive = picked === option
                        return (
                            <Pressable
                                key={option}
                                onPress={() => setPicked(option)}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: isActive }}
                                accessibilityLabel={meta.label}
                                testID={`statusOption-${option}`}
                                className={clsx(
                                    "min-h-[44px] w-[49%] flex-row items-center gap-2 rounded-lg border px-2.5 py-2",
                                    isActive
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                                        : "border-slate-200 dark:border-neutral-700",
                                )}
                            >
                                <View className={clsx("h-2.5 w-2.5 rounded-full", meta.dot)} />
                                <Text
                                    numberOfLines={1}
                                    className={clsx(
                                        "flex-1 text-sm",
                                        isActive
                                            ? "text-blue-900 dark:text-blue-100"
                                            : "text-neutral-700 dark:text-neutral-200",
                                    )}
                                >
                                    {meta.label}
                                </Text>
                                {option === status && <Text className="text-[10px] text-neutral-400">now</Text>}
                            </Pressable>
                        )
                    })}
                </View>

                {isCallBack && <CallbackPicker value={choice} onChange={setChoice} />}

                <NoteBox value={note} onChangeText={setNote} testID="statusNote" />

                {conflict && (
                    <Text accessibilityRole="alert" className="text-xs text-rose-600 dark:text-rose-400">
                        {conflict}
                    </Text>
                )}

                <View className="flex-row items-center justify-between gap-2">
                    <Text className="flex-shrink text-[11px] text-neutral-400">
                        {isCallBack && !hasTime ? "Pick when to call back." : ""}
                    </Text>
                    <View className="flex-row gap-2">
                        <Button label="Cancel" variant="quiet" onPress={onClose} disabled={saving} />
                        <Button
                            disabledReason={offlineReason}
                            testID="statusSave"
                            label={saving ? "Saving..." : "Save"}
                            onPress={save}
                            disabled={!canSave}
                            loading={saving}
                        />
                    </View>
                </View>
            </SheetScrollView>
        </Sheet>
    )
}
