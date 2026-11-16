import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Text, View } from "react-native"

import { LEAD_SOURCE_UPLOADS_API } from "@/api/endpoints"
import ReportHeaderCard from "@/components/leadSources/ReportHeaderCard"
import ReportRows from "@/components/leadSources/ReportRows"
import { AccessDenied, Card, SkeletonBlock } from "@/components/ui"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import type { CallsStackParamList } from "@/navigation/types"
import type { LeadSourceUploadReport } from "@/types/leadSource"

type Navigation = NativeStackNavigationProp<CallsStackParamList, "LeadSourceReport">

// The web's h-32 and h-80 placeholder cards.
const SKELETON_HEIGHTS = [128, 320]

/**
 * One upload's report: the header card with the counts and downloads, then every sheet row with its result and
 * reasons. Managers only. Ported from the web's lead-sources/uploads/[uploadId]/page.tsx.
 */
export default function LeadSourceReportScreen() {
    const navigation = useNavigation<Navigation>()
    const { uploadId } = useRoute<RouteProp<CallsStackParamList, "LeadSourceReport">>().params
    const detail = useDetailQuery<LeadSourceUploadReport>(`${LEAD_SOURCE_UPLOADS_API}/${uploadId}`)
    const report = detail.data

    if (!detail.loading && detail.accessError) {
        return (
            <View className="flex-1 justify-center p-4">
                <AccessDenied message={detail.accessError} />
            </View>
        )
    }

    if (detail.loading) {
        return (
            <View accessibilityLabel="Loading" className="gap-3 p-3">
                {SKELETON_HEIGHTS.map((height) => (
                    <SkeletonBlock key={height} width="100%" height={height} rounded="lg" />
                ))}
            </View>
        )
    }

    if (!report) {
        return (
            <View className="p-3">
                <Card className="items-center py-12">
                    <Text className="text-sm text-neutral-500">Upload not found.</Text>
                </Card>
            </View>
        )
    }

    return (
        <ReportRows
            report={report}
            header={
                <ReportHeaderCard
                    report={report}
                    onOpenImported={() => navigation.popTo("LeadSources", { view: "all", upload: report._id })}
                />
            }
            onOpenSource={(sourceId) => navigation.navigate("LeadSourceDetail", { sourceId })}
        />
    )
}
