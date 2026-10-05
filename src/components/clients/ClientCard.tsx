import { Mail, Phone } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import PhoneText from "@/components/phone/PhoneText"
import { Badge, InlineValue, TimeAgo } from "@/components/ui"
import { CLIENT_STATUS_META } from "@/constants/clientStatus"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { Client } from "@/types/clients"

interface Props {
    client: Client
    onPress: () => void
}

const CARD_CLASSES =
    "rounded-lg border border-slate-200 bg-white p-4 active:border-blue-500/40 dark:rounded-xl dark:border-neutral-800 dark:bg-neutral-900"

// The web's `shadow`, as Android elevation.
const CARD_SHADOW = {
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
}

enableIconClassNames(Mail, Phone)

/** One client in the list. Ported from the web's ClientCard.tsx; the "Created by" tooltip becomes a visible line. */
export default function ClientCard({ client, onPress }: Props) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Client ${client.name}`}
            className={CARD_CLASSES}
            style={CARD_SHADOW}
        >
            <View className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {client.name}
                    </Text>
                    <Text numberOfLines={1} className="text-sm text-neutral-500 dark:text-neutral-400">
                        {client.company}
                    </Text>
                </View>
                <Badge meta={CLIENT_STATUS_META} status={client.status} />
            </View>

            <View className="mt-3 gap-1">
                <View className="flex-row items-center gap-2">
                    <Phone size={16} className="text-neutral-600 dark:text-neutral-400" />
                    <PhoneText phone={client.phone} className="text-sm text-neutral-600 dark:text-neutral-400" />
                </View>
                {!!client.email && (
                    <View className="flex-row items-center gap-2">
                        <Mail size={16} className="text-neutral-600 dark:text-neutral-400" />
                        <Text numberOfLines={1} className="flex-1 text-sm text-neutral-600 dark:text-neutral-400">
                            {client.email}
                        </Text>
                    </View>
                )}
                <TimeAgo date={client.createdAt} className="text-xs text-neutral-400 dark:text-neutral-500" />
            </View>

            {!!client.createdBy && (
                <View className="mt-2">
                    <InlineValue value={`Created by ${client.createdBy.name}`} />
                </View>
            )}
        </Pressable>
    )
}
