import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import LeadForm from "@/components/leads/LeadForm"
import { FormScrollView } from "@/components/ui"
import type { LeadsStackParamList } from "@/navigation/types"

type Navigation = NativeStackNavigationProp<LeadsStackParamList, "LeadCreate">

/** A new lead. On save it opens the lead in place of this form, so Back returns to the list. */
export default function LeadCreateScreen() {
    const navigation = useNavigation<Navigation>()

    return (
        <FormScrollView>
            <LeadForm mode="create" onSaved={(id) => navigation.replace("LeadDetail", { id })} />
        </FormScrollView>
    )
}
