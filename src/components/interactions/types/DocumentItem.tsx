import { ExternalLink, Paperclip } from "lucide-react-native"
import { Linking, Pressable, Text, View } from "react-native"

import { resolveApiUrl } from "@/api/endpoints"
import { Badge } from "@/components/ui"
import { INTERACTION_TYPE_META } from "@/constants/interactionTypes"
import { enableIconClassNames } from "@/lib/iconClassName"

import InteractionRowFrame from "../InteractionRowFrame"
import RowHeader, { RowTitle } from "../RowHeader"
import type { TimelineItem } from "../timelineTypes"

enableIconClassNames(ExternalLink)

/**
 * A document upload (2310). New in the app: the web's timeline has no case for 2310 and renders nothing. It shows the
 * title, the description, the document's name and an Open link.
 */
export default function DocumentItem({ item }: { item: TimelineItem }) {
    const document = item.document ?? null

    return (
        <InteractionRowFrame icon={Paperclip} createdBy={item.createdBy}>
            <RowHeader createdAt={item.createdAt}>
                {!!item.title && <RowTitle>{item.title}</RowTitle>}
                <Badge meta={INTERACTION_TYPE_META} status={item.type} />
            </RowHeader>

            {!!item.description && (
                <Text className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</Text>
            )}

            {document && (
                <View className="flex-row items-center justify-between gap-3 rounded-lg border border-gray-300 bg-neutral-50 p-3 dark:border-gray-600 dark:bg-neutral-800">
                    <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-neutral-800 dark:text-neutral-200">
                        {document.title || "Document"}
                    </Text>
                    {!!document.url && (
                        <Pressable
                            onPress={() => Linking.openURL(resolveApiUrl(document.url ?? ""))}
                            accessibilityRole="link"
                            accessibilityLabel="Open document"
                            className="min-h-[36px] flex-row items-center gap-1 rounded-md border border-neutral-300 px-3 py-1 dark:border-neutral-700"
                        >
                            <ExternalLink size={12} className="text-neutral-700 dark:text-neutral-200" />
                            <Text className="text-xs text-neutral-700 dark:text-neutral-200">Open</Text>
                        </Pressable>
                    )}
                </View>
            )}
        </InteractionRowFrame>
    )
}
