import { TriangleAlert } from "lucide-react-native"
import { Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"

enableIconClassNames(TriangleAlert)

/** The warnings the upload check left on this source. Ported from the amber card on the web's details page. */
export default function ImportNotes({ notes }: { notes: string[] }) {
    if (notes.length === 0) return null
    return (
        <View className="gap-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <View className="flex-row items-center gap-1.5">
                <TriangleAlert size={16} className="text-amber-900 dark:text-amber-200" />
                <Text className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Notes from the upload check
                </Text>
            </View>
            {notes.map((note) => (
                <View key={note} className="flex-row gap-2 pl-1">
                    <Text className="text-sm text-amber-900 dark:text-amber-100">•</Text>
                    <Text className="flex-1 text-sm text-amber-900 dark:text-amber-100">{note}</Text>
                </View>
            ))}
        </View>
    )
}
