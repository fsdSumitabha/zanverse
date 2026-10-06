import type { ReactNode } from "react"
import { Text, View } from "react-native"

import PhoneText from "@/components/phone/PhoneText"
import { Badge, Card, ContactRow } from "@/components/ui"
import { CLIENT_STATUS_META } from "@/constants/clientStatus"
import { formatDateTime } from "@/lib/format"
import type { Client } from "@/types/clients"

interface Props {
    client: Client
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <View className="gap-0.5">
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">{label}</Text>
            {children}
        </View>
    )
}

/**
 * The read-only client a new project is for, so no id is typed. Ported from the web's ClientInfoCard.tsx; the screen
 * loads the client and passes it in.
 */
export default function ClientInfoCard({ client }: Props) {
    return (
        <Card className="gap-4 p-6">
            <View className="flex-row items-start justify-between gap-4">
                <View className="min-w-0 flex-1">
                    <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{client.name}</Text>
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">{client.company}</Text>
                </View>
                <Badge meta={CLIENT_STATUS_META} status={client.status} />
            </View>
            <View className="gap-3">
                {!!client.email && (
                    <InfoRow label="Email">
                        <ContactRow kind="email" value={client.email} />
                    </InfoRow>
                )}
                <InfoRow label="Phone">
                    <PhoneText phone={client.phone} className="text-sm text-neutral-800 dark:text-neutral-200" />
                </InfoRow>
                <InfoRow label="Created">
                    <Text className="text-sm text-neutral-800 dark:text-neutral-200">
                        {formatDateTime(client.createdAt)}
                    </Text>
                </InfoRow>
            </View>
        </Card>
    )
}
