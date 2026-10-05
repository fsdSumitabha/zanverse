import { ArrowRight } from "lucide-react-native"
import type { ReactNode } from "react"
import { Pressable, Text, View } from "react-native"

import { Badge, TimeAgo } from "@/components/ui"
import { CLIENT_STATUS_META } from "@/constants/clientStatus"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { Client } from "@/types/clients"

interface Props {
    client: Client
    onViewClient: () => void
}

interface ItemProps {
    label: string
    children: ReactNode
}

enableIconClassNames(ArrowRight)

function Item({ label, children }: ItemProps) {
    return (
        <View className="w-[47%] min-w-0">
            <Text className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</Text>
            <View className="mt-1">{children}</View>
        </View>
    )
}

/** The client a converted lead became, under the lead card. Ported from the block in the web's lead page. */
export default function ConvertedClientBlock({ client, onViewClient }: Props) {
    return (
        <View className="rounded-b-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="mb-4 flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-2">
                    <ArrowRight size={16} className="text-emerald-500" />
                    <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Converted to Client
                    </Text>
                </View>
                <Pressable
                    onPress={onViewClient}
                    accessibilityRole="link"
                    hitSlop={12}
                    className="min-h-[44px] justify-center"
                >
                    <Text className="text-xs text-emerald-600">View client</Text>
                </Pressable>
            </View>

            <View className="flex-row flex-wrap gap-4">
                <Item label="Name">
                    <Text numberOfLines={1} className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {client.name || "—"}
                    </Text>
                </Item>
                <Item label="Company">
                    <Text numberOfLines={1} className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {client.company || "—"}
                    </Text>
                </Item>
                <Item label="Client status">
                    <Badge meta={CLIENT_STATUS_META} status={client.status} />
                </Item>
                <Item label="Converted">
                    <TimeAgo date={client.createdAt} />
                </Item>
            </View>
        </View>
    )
}
