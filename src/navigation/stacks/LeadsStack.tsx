import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { LeadsStackParamList } from "@/navigation/types"
import LeadConvertScreen from "@/screens/leads/LeadConvertScreen"
import LeadCreateScreen from "@/screens/leads/LeadCreateScreen"
import LeadDetailScreen from "@/screens/leads/LeadDetailScreen"
import LeadEditScreen from "@/screens/leads/LeadEditScreen"
import LeadsListScreen from "@/screens/leads/LeadsListScreen"

const Stack = createNativeStackNavigator<LeadsStackParamList>()

/** The Leads tab's stack: list, detail, create, edit and convert. */
export default function LeadsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="LeadsList" component={LeadsListScreen} />
            <Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
            <Stack.Screen name="LeadCreate" component={LeadCreateScreen} />
            <Stack.Screen name="LeadEdit" component={LeadEditScreen} />
            <Stack.Screen name="LeadConvert" component={LeadConvertScreen} />
        </Stack.Navigator>
    )
}
