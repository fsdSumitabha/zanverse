import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { CallsStackParamList } from "@/navigation/types"
import LeadSourceDetailScreen from "@/screens/leadSources/LeadSourceDetailScreen"
import LeadSourceReportScreen from "@/screens/leadSources/LeadSourceReportScreen"
import LeadSourcesScreen from "@/screens/leadSources/LeadSourcesScreen"
import LeadSourceUploadScreen from "@/screens/leadSources/LeadSourceUploadScreen"
import LeadSourceUploadsScreen from "@/screens/leadSources/LeadSourceUploadsScreen"

const Stack = createNativeStackNavigator<CallsStackParamList>()

/** The Calls tab's stack: the lead sources list, one source, and the sheet uploads with their reports. */
export default function CallsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="LeadSources" component={LeadSourcesScreen} />
            <Stack.Screen name="LeadSourceDetail" component={LeadSourceDetailScreen} />
            <Stack.Screen name="LeadSourceUploads" component={LeadSourceUploadsScreen} />
            <Stack.Screen name="LeadSourceUpload" component={LeadSourceUploadScreen} />
            <Stack.Screen name="LeadSourceReport" component={LeadSourceReportScreen} />
        </Stack.Navigator>
    )
}
