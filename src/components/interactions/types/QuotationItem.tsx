import { Download, FileText } from "lucide-react-native"
import { Linking, Pressable, Text, View } from "react-native"

import { Badge } from "@/components/ui"
import { INTERACTION_TYPE_META } from "@/constants/interactionTypes"
import { formatAmount } from "@/lib/format"
import { PALETTE } from "@/theme"

import InteractionRowFrame from "../InteractionRowFrame"
import RowHeader, { RowTitle } from "../RowHeader"
import type { TimelineItem } from "../timelineTypes"

/** A quotation (2410): the amount, GST and the GST-inclusive total, and the file. Ported from the web's QuotationItem.tsx. */
export default function QuotationItem({ item }: { item: TimelineItem }) {
    const quotation = item.quotation ?? null

    return (
        <InteractionRowFrame
            icon={FileText}
            iconBoxClassName="bg-blue-100 dark:bg-blue-900/30"
            iconClassName="text-blue-600 dark:text-blue-400"
            createdBy={item.createdBy}
        >
            <RowHeader createdAt={item.createdAt}>
                {!!item.title && <RowTitle>{item.title}</RowTitle>}
                <Badge meta={INTERACTION_TYPE_META} status={item.type} />
            </RowHeader>

            {!!item.description && (
                <Text className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</Text>
            )}

            {quotation && (
                <View className="mt-2 flex-row items-center justify-between gap-3 rounded-lg border border-gray-300 bg-neutral-50 p-3 dark:border-gray-600 dark:bg-neutral-800">
                    <View className="min-w-0 flex-1 gap-1">
                        <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                            ₹{formatAmount(quotation.amount)}{" "}
                            <Text className="text-xs text-gray-500"> + {quotation.gst_percentage}% GST </Text>
                        </Text>
                        {!!quotation.gst_percentage && (
                            <Text className="text-xs text-gray-500">
                                Amount Inclusive GST : ₹
                                {formatAmount(quotation.amount * (1 + quotation.gst_percentage / 100))}
                            </Text>
                        )}
                    </View>
                    {!!quotation.url && (
                        <Pressable
                            onPress={() => Linking.openURL(quotation.url ?? "")}
                            accessibilityRole="link"
                            accessibilityLabel="Download quotation"
                            className="min-h-[36px] flex-row items-center gap-1 rounded-md bg-blue-600 px-3 py-1 active:bg-blue-700"
                        >
                            <Download size={12} color={PALETTE.white} />
                            <Text className="text-xs text-white">Download</Text>
                        </Pressable>
                    )}
                </View>
            )}
        </InteractionRowFrame>
    )
}
