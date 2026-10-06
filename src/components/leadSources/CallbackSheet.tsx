import clsx from "clsx"
import { useEffect, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"

import { send } from "@/api/client"
import { LEAD_SOURCES_API } from "@/api/endpoints"
import { Input, Sheet } from "@/components/ui"
import { useNow } from "@/hooks/useNow"
import { callbackPayload, formatCallback, relativeCallback } from "@/lib/callback"
import { notify } from "@/lib/notify"
import type { LeadSourceRow } from "@/types/leadSource"

import CallbackPicker, { EMPTY_CHOICE, resolveChoice, type CallbackChoice } from "./CallbackPicker"
import { NOTE_MAX_LENGTH } from "./NoteBox"

interface Props {
    /** The source whose callback is set, or null when the sheet is closed. */
    source: Pick<LeadSourceRow, "_id" | "name" | "callbackAt"> | null
    onClose: () => void
    onUpdated: (row: LeadSourceRow) => void
}

const NOW_TICK_MS = 15_000

/**
 * The callback reminder on its own: set a time, change it or clear it, with an optional note. Ported from the
 * popover in the web's CallbackMenu.tsx. Sends `PATCH /:id/callback`.
 */
export default function CallbackSheet({ source, onClose, onUpdated }: Props) {
    const now = useNow(NOW_TICK_MS)
    const [choice, setChoice] = useState<CallbackChoice>(EMPTY_CHOICE)
    const [note, setNote] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    // A fresh start every time the sheet opens.
    useEffect(() => {
        if (!source) return
        setChoice(EMPTY_CHOICE)
        setNote("")
    }, [source])

    const callbackAt = source?.callbackAt ?? null
    const hasTime = !!resolveChoice(choice)

    async function submit(isClear: boolean) {
        if (!source) return
        const at = isClear ? null : resolveChoice(choice)
        if (!isClear && !at) return
        setIsSaving(true)
        try {
            const row = await send<LeadSourceRow>(`${LEAD_SOURCES_API}/${source._id}/callback`, "PATCH", {
                ...(at ? callbackPayload(at) : { callbackAt: null }),
                note: note.trim() || undefined,
            })
            onUpdated(row)
            notify.success(at ? `Callback set for ${formatCallback(at.toISOString())}` : "Callback cleared")
            onClose()
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to set the callback")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Sheet
            visible={source !== null}
            onClose={onClose}
            accessibilityLabel={source ? `Callback for ${source.name}` : "Callback"}
            avoidKeyboard
        >
            <ScrollView contentContainerClassName="gap-3 px-5 pb-4 pt-3" keyboardShouldPersistTaps="handled">
                <View className="flex-row items-baseline justify-between gap-2">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Callback reminder
                    </Text>
                    <Text numberOfLines={1} className="flex-shrink text-xs text-neutral-400">
                        {source?.name}
                    </Text>
                </View>

                {callbackAt && (
                    <Text className="rounded-lg bg-violet-50 px-2.5 py-2 text-xs text-violet-800 dark:bg-violet-500/10 dark:text-violet-200">
                        Set for {formatCallback(callbackAt)} ({relativeCallback(callbackAt, now)}).
                    </Text>
                )}

                <CallbackPicker value={choice} onChange={setChoice} />

                <Input
                    value={note}
                    onChangeText={setNote}
                    maxLength={NOTE_MAX_LENGTH}
                    placeholder="Note, for example: asked for the owner (optional)"
                    accessibilityLabel="Callback note"
                />

                <View className="flex-row items-center justify-between gap-2">
                    {callbackAt ? (
                        <Pressable
                            onPress={() => submit(true)}
                            disabled={isSaving}
                            accessibilityRole="button"
                            className="min-h-[44px] justify-center rounded-lg px-2 active:bg-rose-50 dark:active:bg-rose-500/10"
                        >
                            <Text className="text-sm font-medium text-rose-600 dark:text-rose-400">Clear callback</Text>
                        </Pressable>
                    ) : (
                        <View />
                    )}
                    <Pressable
                        onPress={() => submit(false)}
                        disabled={isSaving || !hasTime}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: isSaving || !hasTime }}
                        className={clsx(
                            "min-h-[44px] justify-center rounded-lg bg-violet-600 px-3 active:bg-violet-500",
                            (isSaving || !hasTime) && "opacity-50",
                        )}
                    >
                        <Text className="text-sm font-medium text-white">
                            {isSaving ? "Saving..." : callbackAt ? "Change time" : "Set callback"}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </Sheet>
    )
}
