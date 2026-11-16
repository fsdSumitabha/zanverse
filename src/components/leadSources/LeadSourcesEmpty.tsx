import { Text, View } from "react-native"

import type { LeadSourceView } from "@/types/leadSource"

interface Props {
    view: LeadSourceView
    isManager: boolean
    isFiltered: boolean
}

function getCopy(view: LeadSourceView, isManager: boolean, isFiltered: boolean): { title: string; body: string } {
    if (isFiltered) return { title: "No lead sources match", body: "Change the search or the filters." }
    if (view === "today") {
        return {
            title: "Nothing to call today",
            body: isManager
                ? "Upload a sheet, or give sources in the No day tab a day and a person."
                : "Sources show up here when a manager gives them to you for today.",
        }
    }
    if (view === "upcoming") return { title: "Nothing here", body: "No open sources are set for a later day." }
    if (view === "unscheduled") return { title: "Nothing here", body: "Every open source has a day." }
    if (view === "closed") {
        return { title: "Nothing here", body: "Sources marked Not Interested or Converted show up here." }
    }
    return { title: "Nothing here", body: "" }
}

/** The list with no rows, in the web's words for each view. Ported from the EmptyState in LeadSourcesClient.tsx. */
export default function LeadSourcesEmpty({ view, isManager, isFiltered }: Props) {
    const { title, body } = getCopy(view, isManager, isFiltered)
    return (
        <View className="px-6 py-12">
            <Text className="text-center text-sm font-medium text-neutral-800 dark:text-neutral-200">{title}</Text>
            {!!body && <Text className="mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">{body}</Text>}
        </View>
    )
}
