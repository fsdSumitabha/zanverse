import { send } from "@/api/client"
import StatusSheet from "@/components/status/StatusSheet"
import { LEAD_STATUS, LEAD_STATUS_META, type LeadStatus } from "@/constants/leadStatus"

interface Props {
    leadId: string
    currentStatus: LeadStatus
    /** Called after the server saved the change, so the screen can refetch. */
    onUpdated: () => void
}

// Every status but Converted, which only the convert flow sets. As the web's LeadStatusDropdown.
const STATUS_OPTIONS = (Object.keys(LEAD_STATUS_META).map(Number) as LeadStatus[]).filter(
    (status) => status !== LEAD_STATUS.CONVERTED,
)

/** The lead's status pill and sheet. Read-only at Converted and Lost, as the web. */
export default function LeadStatusSheet({ leadId, currentStatus, onUpdated }: Props) {
    async function handleConfirm(status: LeadStatus, remarks: string) {
        await send(`/api/admin/operations/leads/${leadId}/status`, "PATCH", { status, remarks })
    }

    return (
        <StatusSheet
            meta={LEAD_STATUS_META}
            currentStatus={currentStatus}
            options={STATUS_OPTIONS}
            isTerminal={currentStatus >= LEAD_STATUS.CONVERTED}
            onConfirm={handleConfirm}
            onUpdated={onUpdated}
        />
    )
}
