import { Building2, Clock, Mail, RefreshCw } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import WhatsAppLink from "@/components/phone/WhatsAppLink"
import { TimeAgo } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { canOpen } from "@/navigation/permissions"
import type { Client } from "@/types/clients"

import ClientStatusSheet from "./ClientStatusSheet"

interface Props {
    client: Client
    onEdit: () => void
    /** Called after a status change, so the screen can refetch the client and the timeline. */
    onStatusUpdated: () => void
}

/** Roles allowed to edit a Client. Mirrors the backend PATCH role list. Copied from the web's ClientDetails.tsx. */
const CLIENT_EDIT_ROLES = [10, 15, 60, 69, 45, 70]

// The web's shadow-sm, as Android elevation.
const CARD_SHADOW = { elevation: 1 }

enableIconClassNames(Building2, Clock, Mail, RefreshCw)

function Divider() {
    return <View className="h-px bg-neutral-100 dark:bg-neutral-800" />
}

/** The client's header card: name, company, Edit, the status pill, contact rows and dates. Ported from ClientDetails. */
export default function ClientHeaderCard({ client, onEdit, onStatusUpdated }: Props) {
    const { role } = useAuth()
    // The web's list, narrowed to the roles that may open the edit screen, so the link never leads to AccessDenied.
    const showEdit = role !== null && CLIENT_EDIT_ROLES.includes(role) && canOpen("ClientEdit", role)

    return (
        <View
            className="gap-4 rounded-t-lg border border-neutral-200 bg-white p-5 dark:rounded-t-xl dark:border-neutral-800 dark:bg-neutral-900"
            style={CARD_SHADOW}
        >
            <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-xl font-semibold text-gray-900 dark:text-white">
                        {client.name}
                    </Text>
                    <Text numberOfLines={1} className="mt-0.5 text-sm text-gray-400">
                        {client.company}
                    </Text>
                </View>
                <View className="flex-row items-center gap-2">
                    {showEdit && (
                        <Pressable
                            onPress={onEdit}
                            accessibilityRole="button"
                            accessibilityLabel="Edit client"
                            className="min-h-[36px] justify-center rounded border border-blue-500/40 px-3 py-1.5 active:bg-blue-500/10"
                        >
                            <Text className="text-xs text-blue-500">Edit</Text>
                        </Pressable>
                    )}
                    <ClientStatusSheet
                        clientId={client._id}
                        currentStatus={client.status}
                        onUpdated={onStatusUpdated}
                    />
                </View>
            </View>

            <Divider />

            <View className="gap-3">
                {!!client.email && (
                    <View className="flex-row items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <Text selectable numberOfLines={1} className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                            {client.email}
                        </Text>
                    </View>
                )}
                {!!client.phone && <WhatsAppLink phone={client.phone} />}
                {!!client.company && (
                    <View className="flex-row items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        <Text numberOfLines={1} className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                            {client.company}
                        </Text>
                    </View>
                )}
            </View>

            <Divider />

            <View className="flex-row flex-wrap items-center gap-4">
                {!!client.createdAt && (
                    <View className="flex-row items-center gap-1.5">
                        <Clock size={14} className="text-gray-400" />
                        <Text className="text-xs text-gray-400">Joined</Text>
                        <TimeAgo date={client.createdAt} className="text-xs text-gray-400" />
                    </View>
                )}
                {!!client.updatedAt && (
                    <View className="flex-row items-center gap-1.5">
                        <RefreshCw size={14} className="text-gray-400" />
                        <Text className="text-xs text-gray-400">Updated</Text>
                        <TimeAgo date={client.updatedAt} className="text-xs text-gray-400" />
                    </View>
                )}
            </View>
        </View>
    )
}
