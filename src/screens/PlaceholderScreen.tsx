import { useRoute } from "@react-navigation/native"
import { ScrollView, Text, View } from "react-native"

import { Card } from "@/components/ui"

/**
 * Stands in for every screen a later session builds. It prints the route name and its params, so a deep link or a
 * cross-tab jump can be checked on the device.
 */
export default function PlaceholderScreen() {
    const route = useRoute()
    const params = route.params ? JSON.stringify(route.params, null, 2) : "(none)"

    return (
        <ScrollView contentContainerClassName="gap-4 p-4">
            <Card className="gap-3 p-4">
                <View className="gap-1">
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">Route</Text>
                    <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{route.name}</Text>
                </View>
                <View className="gap-1">
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">Params</Text>
                    <Text selectable className="text-sm text-neutral-800 dark:text-neutral-200">
                        {params}
                    </Text>
                </View>
            </Card>
            <Text className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                This screen is built in a later session.
            </Text>
        </ScrollView>
    )
}
