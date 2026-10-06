import { TriangleAlert } from "lucide-react-native"
import { Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"

export interface HeaderProblem {
    message: string
    missing?: string[]
    found?: string[]
}

enableIconClassNames(TriangleAlert)

/** Why the server refused the whole file. Ported from the rose card in the web's UploadForm. */
export default function UploadProblem({ problem }: { problem: HeaderProblem }) {
    return (
        <View
            accessibilityRole="alert"
            className="gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10"
        >
            <View className="flex-row items-start gap-2">
                <TriangleAlert size={16} className="mt-0.5 text-rose-900 dark:text-rose-100" />
                <Text className="flex-1 text-sm font-medium text-rose-900 dark:text-rose-100">{problem.message}</Text>
            </View>
            {!!problem.found && problem.found.length > 0 && (
                <Text className="pl-6 text-xs text-rose-900 dark:text-rose-100">
                    Headers found in the file: <Text className="font-mono">{problem.found.join(", ")}</Text>
                </Text>
            )}
            <Text className="pl-6 text-xs text-rose-900 dark:text-rose-100">
                Nothing was saved. Fix the file and upload it again.
            </Text>
        </View>
    )
}
