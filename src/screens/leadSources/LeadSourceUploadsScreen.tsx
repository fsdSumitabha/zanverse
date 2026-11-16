import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { FileUp } from "lucide-react-native"
import { Text, View } from "react-native"

import { LEAD_SOURCE_UPLOADS_API } from "@/api/endpoints"
import UploadSummaryRow, { UploadSummarySkeleton } from "@/components/leadSources/UploadSummaryRow"
import ListScreen from "@/components/list/ListScreen"
import { Button } from "@/components/ui"
import { useListQuery } from "@/hooks/useListQuery"
import type { CallsStackParamList } from "@/navigation/types"
import type { LeadSourceUploadSummary } from "@/types/leadSource"

type Navigation = NativeStackNavigationProp<CallsStackParamList, "LeadSourceUploads">

// The route's own default page size.
const PAGE_SIZE = 20

function getCountLabel(total: number): string {
    return `${total} ${total === 1 ? "upload" : "uploads"}`
}

/** Every sheet uploaded in the person's regions, newest first. Managers only. Ported from the web's UploadsClient. */
export default function LeadSourceUploadsScreen() {
    const navigation = useNavigation<Navigation>()
    const query = useListQuery<LeadSourceUploadSummary>({ path: LEAD_SOURCE_UPLOADS_API, pageSize: PAGE_SIZE })

    return (
        <ListScreen
            query={query}
            isSearchable={false}
            renderItem={(upload) => (
                <UploadSummaryRow
                    upload={upload}
                    onPress={() => navigation.navigate("LeadSourceReport", { uploadId: upload._id })}
                />
            )}
            SkeletonComponent={UploadSummarySkeleton}
            emptyText="No sheets uploaded yet."
            getCountLabel={getCountLabel}
            headerExtra={
                <View className="gap-3">
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                        Every sheet uploaded in your regions, newest first.
                    </Text>
                    <Button
                        label="Upload sheet"
                        icon={FileUp}
                        onPress={() => navigation.navigate("LeadSourceUpload")}
                    />
                </View>
            }
        />
    )
}
