import { Plus, Trash2 } from "lucide-react-native"
import { useState } from "react"
import { Text, View } from "react-native"

import { Button, Card, Pagination, SectionHeader } from "@/components/ui"
import { notify } from "@/lib/notify"

import KitchenSection from "./KitchenSection"

const TOTAL_PAGES = 5

/** Button, Card, SectionHeader and Pagination. */
export default function ActionSections() {
    const [page, setPage] = useState(1)

    return (
        <>
            <KitchenSection
                title="Button"
                note="Each variant is the web's class string. Press one: it scales a little and shows the Android ripple."
            >
                <View className="flex-row flex-wrap gap-2">
                    <Button label="Primary" onPress={() => notify.info("Primary pressed")} />
                    <Button
                        label="Danger"
                        variant="danger"
                        icon={Trash2}
                        onPress={() => notify.info("Danger pressed")}
                    />
                    <Button label="Quiet" variant="quiet" onPress={() => notify.info("Quiet pressed")} />
                </View>
                <Button label="Create lead" variant="soft" icon={Plus} onPress={() => notify.info("Soft pressed")} />
                <View className="flex-row flex-wrap gap-2">
                    <Button label="Saving" loading onPress={() => undefined} />
                    <Button label="Disabled" variant="quiet" disabled onPress={() => undefined} />
                </View>
            </KitchenSection>

            <KitchenSection title="Card">
                <Card className="p-4">
                    <Text className="text-sm text-neutral-700 dark:text-neutral-200">
                        A card inside a card: white with a gray-200 border in light mode, neutral-900 with a neutral-800
                        border in dark mode, and a shadow-sm as Android elevation.
                    </Text>
                </Card>
            </KitchenSection>

            <KitchenSection title="SectionHeader" note="With a count and an action. The long title is cut to one line.">
                <SectionHeader
                    title="Today's call list"
                    count={24}
                    action={<Button label="See all" variant="quiet" onPress={() => notify.info("See all pressed")} />}
                />
                <SectionHeader
                    title="A very long section title that does not fit on one line of a narrow phone screen"
                    count={3}
                />
            </KitchenSection>

            <KitchenSection title="Pagination" note="The fallback for lists that do not load more on scroll.">
                <Pagination page={page} totalPages={TOTAL_PAGES} onChange={setPage} />
            </KitchenSection>
        </>
    )
}
