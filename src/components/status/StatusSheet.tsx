import clsx from "clsx"
import { Check } from "lucide-react-native"
import { useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"

import { Button, Sheet, Textarea } from "@/components/ui"
import { useStatus } from "@/contexts/StatusContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import { notify } from "@/lib/notify"

interface Props<S extends number> {
    /** The entity's *_STATUS_META map: labels and pill colours. */
    meta: Readonly<Record<S, { label: string; color: string }>>
    currentStatus: S
    /** The statuses offered, in order. */
    options: S[]
    /** True when the status can no longer change. The pill is then read-only. */
    isTerminal: boolean
    /** Saves the change. Throws with the server's message on failure. */
    onConfirm: (status: S, remarks: string) => Promise<void>
    /** Called after a successful save, so the screen can refetch. */
    onUpdated: () => void
}

const REMARKS_REQUIRED = "Remarks are required"
const TRIGGER_BASE = "min-h-[36px] justify-center rounded-md px-3 py-1.5 text-sm font-medium"
const FALLBACK_META = { label: "Unknown", color: "bg-gray-500 text-white" }

enableIconClassNames(Check)

/**
 * A status pill that opens a two-step sheet: pick a status, then write the required remarks and confirm. Ported from
 * the web's *StatusDropdown components and the remarks box in LeadDetails / ClientDetails. The step state lives in
 * StatusContext (nextStatus, showRemarks, remarks, reset), as on the web.
 */
export default function StatusSheet<S extends number>({
    meta,
    currentStatus,
    options,
    isTerminal,
    onConfirm,
    onUpdated,
}: Props<S>) {
    const { nextStatus, setNextStatus, showRemarks, setShowRemarks, remarks, setRemarks, reset } = useStatus()
    const [isOpen, setIsOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [remarksError, setRemarksError] = useState<string | null>(null)

    const current = meta[currentStatus] ?? FALLBACK_META
    const trigger = toNativeClasses(`${TRIGGER_BASE} ${current.color}`)
    const pendingLabel = nextStatus !== null ? meta[nextStatus as S]?.label ?? "" : ""

    function handleClose() {
        if (isSaving) return
        setIsOpen(false)
        setRemarksError(null)
        reset()
    }

    function handleSelect(status: S) {
        if (status === currentStatus) return
        setNextStatus(status)
        setRemarks("")
        setRemarksError(null)
        setShowRemarks(true)
    }

    async function handleConfirm() {
        if (!remarks.trim()) {
            setRemarksError(REMARKS_REQUIRED)
            return
        }
        if (nextStatus === null) return

        setIsSaving(true)
        try {
            await onConfirm(nextStatus as S, remarks)
            notify.success("Status updated")
            setIsOpen(false)
            reset()
            onUpdated()
        } catch (err) {
            notify.error(err instanceof Error ? err.message : "Failed to update status")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <Pressable
                onPress={() => setIsOpen(true)}
                disabled={isTerminal || isSaving}
                accessibilityRole="button"
                accessibilityLabel={
                    isTerminal ? `Status: ${current.label}` : `Status: ${current.label}. Press to change.`
                }
                accessibilityState={{ disabled: isTerminal || isSaving, busy: isSaving }}
                className={clsx(
                    trigger.container,
                    isSaving ? "opacity-50" : isTerminal ? "opacity-70" : "active:opacity-90",
                )}
            >
                <Text className={trigger.text}>{isSaving ? "Updating..." : current.label}</Text>
            </Pressable>

            <Sheet visible={isOpen} onClose={handleClose} accessibilityLabel="Change status" avoidKeyboard>
                <ScrollView contentContainerClassName="gap-3 px-5 pb-4 pt-3" keyboardShouldPersistTaps="handled">
                    {!showRemarks ? (
                        <>
                            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                Change status
                            </Text>
                            <View>
                                {options.map((status) => {
                                    const isActive = status === currentStatus
                                    return (
                                        <Pressable
                                            key={status}
                                            onPress={() => handleSelect(status)}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: isActive }}
                                            className={clsx(
                                                "min-h-[48px] flex-row items-center justify-between gap-2 rounded-lg px-3 py-2",
                                                isActive
                                                    ? "bg-blue-50 dark:bg-blue-500/10"
                                                    : "active:bg-neutral-100 dark:active:bg-neutral-800",
                                            )}
                                        >
                                            <View>
                                                <Text
                                                    className={clsx(
                                                        "text-sm font-medium",
                                                        isActive
                                                            ? "text-blue-700 dark:text-blue-300"
                                                            : "text-neutral-700 dark:text-neutral-200",
                                                    )}
                                                >
                                                    {meta[status]?.label}
                                                </Text>
                                                {isActive && (
                                                    <Text className="mt-0.5 text-[11px] text-blue-600/70 dark:text-blue-300/70">
                                                        Current
                                                    </Text>
                                                )}
                                            </View>
                                            {isActive && (
                                                <Check size={16} className="text-blue-600 dark:text-blue-300" />
                                            )}
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </>
                    ) : (
                        <>
                            <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Change to &quot;{pendingLabel}&quot;
                            </Text>
                            <Textarea
                                value={remarks}
                                onChangeText={(text) => {
                                    setRemarks(text)
                                    if (remarksError) setRemarksError(null)
                                }}
                                placeholder="Add remarks (required)"
                                accessibilityLabel="Remarks"
                                error={remarksError}
                                autoFocus
                            />
                            <View className="flex-row justify-end gap-2">
                                <Button label="Cancel" variant="quiet" onPress={handleClose} disabled={isSaving} />
                                <Button
                                    label={isSaving ? "Saving..." : "Confirm"}
                                    onPress={handleConfirm}
                                    loading={isSaving}
                                />
                            </View>
                        </>
                    )}
                </ScrollView>
            </Sheet>
        </>
    )
}
