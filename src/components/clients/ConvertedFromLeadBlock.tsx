import { ArrowRight } from "lucide-react-native"
import type { ReactNode } from "react"
import { Pressable, Text, View } from "react-native"

import { Badge, TimeAgo } from "@/components/ui"
import { LEAD_STATUS_META } from "@/constants/leadStatus"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { Lead } from "@/types/lead"

interface Props {
    lead: Lead
    /** When the client was created, which is when the lead was converted. */
    convertedAt: string
    onViewLead: () => void
}

enableIconClassNames(ArrowRight)

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <View className="flex-row items-center justify-between gap-3">
            <Text className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</Text>
            <View className="min-w-0 flex-shrink items-end">{children}</View>
        </View>
    )
}

/**
 * The lead a client came from, under the client card. Ported from the block in the web's client page; its 4-column
 * grid becomes label/value rows.
 */
export default function ConvertedFromLeadBlock({ lead, convertedAt, onViewLead }: Props) {
    return (
        <View className="rounded-b-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="mb-4 flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-2">
                    <ArrowRight size={16} className="text-blue-500" />
                    <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Converted from Lead
                    </Text>
                </View>
                <Pressable
                    onPress={onViewLead}
                    accessibilityRole="link"
                    hitSlop={12}
                    className="min-h-[44px] justify-center"
                >
                    <Text className="text-xs text-blue-500">View lead</Text>
                </Pressable>
            </View>

            <View className="gap-3">
                <Row label="Source">
                    <Text className="text-sm font-medium capitalize text-neutral-900 dark:text-neutral-100">
                        {lead.source || "—"}
                    </Text>
                </Row>
                <Row label="Lead status">
                    <Badge meta={LEAD_STATUS_META} status={lead.status} />
                </Row>
                <Row label="Captured">
                    <TimeAgo date={lead.createdAt} />
                </Row>
                <Row label="Converted">
                    <TimeAgo date={convertedAt} />
                </Row>
            </View>
        </View>
    )
}
