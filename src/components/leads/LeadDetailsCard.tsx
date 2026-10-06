import { Pressable, Text, View } from "react-native"

import WhatsAppLink from "@/components/phone/WhatsAppLink"
import { Card } from "@/components/ui"
import { LEAD_STATUS } from "@/constants/leadStatus"
import { useAuth } from "@/contexts/AuthContext"
import { formatDateTime } from "@/lib/format"
import { canOpen } from "@/navigation/permissions"
import type { Lead } from "@/types/lead"

import ConvertButton from "./ConvertButton"
import LeadStatusSheet from "./LeadStatusSheet"

interface Props {
    lead: Lead
    onEdit: () => void
    onConvert: () => void
    /** Called after a status change, so the screen can refetch. */
    onStatusUpdated: () => void
}

/** Roles allowed to edit a Lead. Mirrors the backend PATCH role list. Copied from the web's LeadDetails.tsx. */
const LEAD_EDIT_ROLES = [10, 15, 60, 69, 45, 70]

/**
 * The lead's header card: name, source, Edit, the status button, Convert at status 50, phone and email, and the
 * created date. Ported from the web's LeadDetails.tsx; the remarks box moved into LeadStatusSheet.
 */
export default function LeadDetailsCard({ lead, onEdit, onConvert, onStatusUpdated }: Props) {
    const { role } = useAuth()
    // The web's list, narrowed to the roles that may open the edit screen, so the link never leads to AccessDenied.
    const showEdit = role !== null && LEAD_EDIT_ROLES.includes(role) && canOpen("LeadEdit", role)
    const showConvert = lead.status === LEAD_STATUS.NEGOTIATION && canOpen("LeadConvert", role)

    return (
        <Card className="gap-4 p-5 dark:border-neutral-700">
            <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                    <Text className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{lead.name}</Text>
                    <Text className="text-sm text-gray-500">{lead.source}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    {showEdit && (
                        <Pressable
                            onPress={onEdit}
                            accessibilityRole="button"
                            accessibilityLabel="Edit lead"
                            className="min-h-[36px] justify-center rounded border border-blue-500/40 px-3 py-1.5 active:bg-blue-500/10"
                        >
                            <Text className="text-xs text-blue-500">Edit</Text>
                        </Pressable>
                    )}
                    <LeadStatusSheet leadId={lead._id} currentStatus={lead.status} onUpdated={onStatusUpdated} />
                </View>
            </View>

            {showConvert && <ConvertButton onPress={onConvert} />}

            <View className="gap-4">
                <View>
                    <Text className="text-sm text-gray-500">Phone</Text>
                    <WhatsAppLink phone={lead.phone} />
                </View>
                {!!lead.email && (
                    <View>
                        <Text className="text-sm text-gray-500">Email</Text>
                        <Text selectable className="text-sm text-neutral-800 dark:text-neutral-200">
                            {lead.email}
                        </Text>
                    </View>
                )}
            </View>

            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                Created: {formatDateTime(lead.createdAt)}
            </Text>
        </Card>
    )
}
