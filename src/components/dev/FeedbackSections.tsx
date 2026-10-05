import { SearchX } from "lucide-react-native"
import { View } from "react-native"

import { AccessDenied, Button, EmptyState, SkeletonBlock, SkeletonList } from "@/components/ui"
import { notify } from "@/lib/notify"

import KitchenSection from "./KitchenSection"

// The web's two toast ids. A second toast with the same id must not stack on the first.
const AUTH_TOAST_ID = "auth-401"
const CALL_TOAST_ID = "lead-source-call"
const DEDUPE_REPEATS = 3

function fireAuthToastThreeTimes() {
    for (let attempt = 0; attempt < DEDUPE_REPEATS; attempt++) {
        notify.error("Session expired. Please log in again.", { id: AUTH_TOAST_ID })
    }
}

// The web's dialer.ts toast: an info toast with a description and an action button.
function fireCallToast() {
    notify.info("Call Asha Rao", {
        id: CALL_TOAST_ID,
        description: "+91 98765 43210. Calling from the CRM is not set up yet. Dial this number on your phone.",
        action: { label: "Copy number", onClick: () => notify.success("Number copied") },
    })
}

/** SkeletonBlock and SkeletonList, EmptyState, AccessDenied, and the toast host with notify. */
export default function FeedbackSections() {
    return (
        <>
            <KitchenSection title="Skeleton" note="SkeletonBlock in a few shapes, then SkeletonList with two cards.">
                <View className="flex-row items-center gap-3">
                    <SkeletonBlock width={40} height={40} rounded="full" />
                    <View className="flex-1 gap-2">
                        <SkeletonBlock width="70%" height={14} />
                        <SkeletonBlock width="40%" height={12} />
                    </View>
                    <SkeletonBlock width={72} height={28} rounded="md" />
                </View>
                <SkeletonList count={2} />
            </KitchenSection>

            <KitchenSection title="EmptyState">
                <EmptyState
                    icon={SearchX}
                    title="No lead sources"
                    message="Nothing matches these filters. Clear them to see every source."
                    actionLabel="Clear filters"
                    onAction={() => notify.info("Filters cleared")}
                />
            </KitchenSection>

            <KitchenSection title="AccessDenied" note="The default message, then a message from the API.">
                <AccessDenied />
                <AccessDenied message="Only managers can upload sheets." />
            </KitchenSection>

            <KitchenSection
                title="Toast and notify"
                note={`"auth-401 x3" fires the same id three times in a row: one toast must show.`}
            >
                <View className="flex-row flex-wrap gap-2">
                    <Button label="Success" variant="quiet" onPress={() => notify.success("Lead created")} />
                    <Button label="Error" variant="quiet" onPress={() => notify.error("Could not save the lead")} />
                    <Button label="Info" variant="quiet" onPress={() => notify.info("Sheet upload started")} />
                    <Button
                        label="Warning"
                        variant="quiet"
                        onPress={() => notify.warning("3 rows were skipped", { description: "See the upload report." })}
                    />
                </View>
                <View className="flex-row flex-wrap gap-2">
                    <Button label="Call toast with action" variant="quiet" onPress={fireCallToast} />
                    <Button label="auth-401 x3" variant="danger" onPress={fireAuthToastThreeTimes} />
                </View>
            </KitchenSection>
        </>
    )
}
