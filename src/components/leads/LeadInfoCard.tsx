import type { ReactNode } from "react"
import { Text, View } from "react-native"

import PhoneText from "@/components/phone/PhoneText"
import { Badge, Card } from "@/components/ui"
import { LEAD_STATUS_META } from "@/constants/leadStatus"
import type { Lead } from "@/types/lead"

interface Props {
    lead: Lead
}

interface LineProps {
    label: string
    children: ReactNode
}

function InfoLine({ label, children }: LineProps) {
    return (
        <Text className="text-sm text-gray-600 dark:text-gray-300">
            <Text className="font-bold">{label}:</Text> {children}
        </Text>
    )
}

/** The read-only lead summary above the convert form. Ported from the web's LeadInfoCard.tsx. */
export default function LeadInfoCard({ lead }: Props) {
    return (
        <Card className="p-5">
            <View className="mb-4 flex-row items-center justify-between gap-3">
                <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">Lead Details</Text>
                <Badge meta={LEAD_STATUS_META} status={lead.status} />
            </View>
            <View className="gap-2">
                <InfoLine label="Name">{lead.name}</InfoLine>
                <InfoLine label="Phone">
                    <PhoneText phone={lead.phone} />
                </InfoLine>
                {!!lead.email && <InfoLine label="Email">{lead.email}</InfoLine>}
                <InfoLine label="Source">{lead.source}</InfoLine>
            </View>
        </Card>
    )
}
