import Clipboard from "@react-native-clipboard/clipboard"
import { Copy, Video } from "lucide-react-native"
import { useEffect, useRef, useState } from "react"
import { Linking, Pressable, Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"

const COPIED_MS = 1500

enableIconClassNames(Copy, Video)

/** Join and Copy for an online meeting's link. Ported from the web's MeetingLinkButton.tsx. */
export default function MeetingLinkButton({ link }: { link: string }) {
    const [copied, setCopied] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(
        () => () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        },
        [],
    )

    function handleCopy() {
        Clipboard.setString(link)
        setCopied(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setCopied(false), COPIED_MS)
    }

    return (
        <View className="flex-row items-center gap-2">
            <Pressable
                onPress={() => Linking.openURL(link)}
                accessibilityRole="link"
                accessibilityLabel="Join meeting"
                className="min-h-[36px] flex-row items-center gap-1 rounded-md border border-green-900 px-2 py-1 active:bg-emerald-700 dark:bg-emerald-700"
            >
                <Video size={12} className="text-green-600 dark:text-green-400" />
                <Text className="text-xs text-green-600 dark:text-green-400">Join</Text>
            </Pressable>
            <Pressable
                onPress={handleCopy}
                accessibilityRole="button"
                accessibilityLabel={copied ? "Copied" : "Copy meeting link"}
                className="min-h-[36px] flex-row items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 active:bg-neutral-100 dark:border-neutral-700 dark:active:bg-neutral-800"
            >
                <Copy size={12} className="text-neutral-700 dark:text-neutral-200" />
                <Text className="text-xs text-neutral-700 dark:text-neutral-200">{copied ? "Copied" : "Copy"}</Text>
            </Pressable>
        </View>
    )
}
