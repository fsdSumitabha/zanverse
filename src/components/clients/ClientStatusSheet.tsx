import { send } from "@/api/client"
import StatusSheet from "@/components/status/StatusSheet"
import { CLIENT_STATUS, CLIENT_STATUS_META, type ClientStatus } from "@/constants/clientStatus"

interface Props {
    clientId: string
    currentStatus: ClientStatus
    /** Called after the server saved the change, so the screen can refetch. */
    onUpdated: () => void
}

const STATUS_OPTIONS = Object.keys(CLIENT_STATUS_META).map(Number) as ClientStatus[]

/**
 * The client's status pill and sheet. Read-only at Completed, as the web's ClientStatusDropdown, so the server's
 * "Cannot update a completed client" never has to answer.
 */
export default function ClientStatusSheet({ clientId, currentStatus, onUpdated }: Props) {
    async function handleConfirm(status: ClientStatus, remarks: string) {
        await send(`/api/admin/operations/clients/${clientId}/status`, "PATCH", { status, remarks })
    }

    return (
        <StatusSheet
            meta={CLIENT_STATUS_META}
            currentStatus={currentStatus}
            options={STATUS_OPTIONS}
            isTerminal={currentStatus === CLIENT_STATUS.COMPLETED}
            onConfirm={handleConfirm}
            onUpdated={onUpdated}
        />
    )
}
