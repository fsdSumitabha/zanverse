import { ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import ActionSections from "@/components/dev/ActionSections"
import BadgeSections from "@/components/dev/BadgeSections"
import FeedbackSections from "@/components/dev/FeedbackSections"
import FormSections from "@/components/dev/FormSections"
import KitchenSection from "@/components/dev/KitchenSection"
import MediaSections from "@/components/dev/MediaSections"
import { Fab } from "@/components/ui"
import { notify } from "@/lib/notify"
import NativeModuleChecks from "@/screens/spike/NativeModuleChecks"

const TOP_GAP = 16
// Room under the last section for the floating button, so it never covers content.
const FAB_CLEARANCE = 56 + 32

/** Every shared UI primitive on one scrolling page, in light and dark mode. Opened from More, in debug builds. */
export default function KitchenSinkScreen() {
    const insets = useSafeAreaInsets()

    return (
        <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
            <ScrollView
                contentContainerClassName="gap-6 px-4"
                contentContainerStyle={{
                    paddingTop: insets.top + TOP_GAP,
                    paddingBottom: insets.bottom + FAB_CLEARANCE,
                }}
                keyboardShouldPersistTaps="handled"
            >
                <View>
                    <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Kitchen sink</Text>
                    <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Session 3: every primitive in src/components/ui.
                    </Text>
                </View>

                <BadgeSections />
                <ActionSections />
                <FormSections />
                <FeedbackSections />
                <MediaSections />

                <KitchenSection
                    title="Fab"
                    note="The blue button at the bottom right. It must sit clear of the gesture bar."
                >
                    <Text className="text-sm text-neutral-700 dark:text-neutral-200">
                        Bottom offset: insets.bottom ({Math.round(insets.bottom)}) + 16.
                    </Text>
                </KitchenSection>

                {/* Kept reachable for the session 1 device checklist, now that the spike tabs are not mounted. */}
                <NativeModuleChecks />
            </ScrollView>

            <Fab accessibilityLabel="Add" onPress={() => notify.info("Floating button pressed")} />
        </View>
    )
}
