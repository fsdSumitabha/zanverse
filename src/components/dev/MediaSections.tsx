import { Text, View, useColorScheme } from "react-native"

import { API_BASE_URL } from "@/api/endpoints"
import { Avatar, InlineValue, TimeAgo } from "@/components/ui"
import { getImagekitUrl } from "@/lib/imagekitUrl"
import { BRAND_COLOR } from "@/theme"

import KitchenSection from "./KitchenSection"

const AVATAR_SIZE = 48

interface AvatarSample {
    label: string
    uri: string
}

const AVATAR_SAMPLES: AvatarSample[] = [
    { label: "ImageKit URL", uri: "https://ik.imagekit.io/demo/default-image.jpg" },
    { label: "Broken URL", uri: "https://ik.imagekit.io/demo/zanverse-missing-avatar.jpg" },
    { label: "No avatar", uri: "" },
    { label: "Legacy path", uri: "/uploads/avatars/legacy.jpg" },
]

const MINUTE = 60_000
const LONG_CREATOR = "Created by Venkata Lakshmi Narasimha Subrahmanyam Chakravarthy, Business Development Executive"

/** The theme colours, Avatar, TimeAgo and InlineValue. */
export default function MediaSections() {
    const isDarkMode = useColorScheme() === "dark"
    const now = Date.now()

    return (
        <>
            <KitchenSection
                title="Theme"
                note="The web's themeColor. Switch the phone to dark mode: every section recolours."
            >
                <View className="flex-row gap-3">
                    {(["light", "dark"] as const).map((scheme) => (
                        <View key={scheme} className="flex-1 gap-1">
                            <View className="h-10 rounded-lg" style={{ backgroundColor: BRAND_COLOR[scheme] }} />
                            <Text className="text-xs text-neutral-600 dark:text-neutral-300">
                                {scheme} {BRAND_COLOR[scheme]}
                            </Text>
                        </View>
                    ))}
                </View>
                <Text className="text-sm text-neutral-700 dark:text-neutral-200">
                    The phone is in {isDarkMode ? "dark" : "light"} mode.
                </Text>
            </KitchenSection>

            <KitchenSection
                title="Avatar"
                note="An ImageKit image, then three that fall back to the User icon. The URL each one loads is under it."
            >
                {AVATAR_SAMPLES.map((sample) => (
                    <View key={sample.label} className="flex-row items-center gap-3">
                        <Avatar uri={sample.uri} size={AVATAR_SIZE} name={sample.label} />
                        <View className="min-w-0 flex-1">
                            <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                {sample.label}
                            </Text>
                            <InlineValue
                                value={getImagekitUrl(sample.uri, AVATAR_SIZE, API_BASE_URL) ?? "(nothing to load)"}
                            />
                        </View>
                    </View>
                ))}
            </KitchenSection>

            <KitchenSection title="TimeAgo" note="Press a time to see the full date. Press again to go back.">
                <TimeAgo date={new Date(now - 5 * MINUTE)} />
                <TimeAgo date={new Date(now - 26 * 60 * MINUTE)} />
                <TimeAgo date={new Date(now + 2 * 60 * MINUTE)} />
            </KitchenSection>

            <KitchenSection
                title="InlineValue"
                note="The Tooltip replacement: the web's hover text as a second line. A long value is cut to one line."
            >
                <View>
                    <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Acme Traders</Text>
                    <InlineValue value="Created by Priya Sharma" />
                </View>
                <View>
                    <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Long value</Text>
                    <InlineValue value={LONG_CREATOR} />
                </View>
            </KitchenSection>
        </>
    )
}
