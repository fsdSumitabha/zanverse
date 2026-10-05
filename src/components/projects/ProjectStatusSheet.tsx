import { send } from "@/api/client"
import StatusSheet from "@/components/status/StatusSheet"
import { Badge } from "@/components/ui"
import { PROJECT_STATUS, PROJECT_STATUS_META, type ProjectStatus } from "@/constants/projectStatus"

interface Props {
    projectId: string
    currentStatus: ProjectStatus
    /** Called after the server saved the change, so the screen can refetch. */
    onUpdated: () => void
}

const STATUS_OPTIONS = Object.keys(PROJECT_STATUS_META).map(Number) as ProjectStatus[]

/** The project's status pill and sheet. At Closed it is a plain badge, as the web's ProjectStatusDropdown locks it. */
export default function ProjectStatusSheet({ projectId, currentStatus, onUpdated }: Props) {
    if (currentStatus === PROJECT_STATUS.CLOSED) {
        return <Badge meta={PROJECT_STATUS_META} status={currentStatus} />
    }

    async function handleConfirm(status: ProjectStatus, remarks: string) {
        await send(`/api/admin/operations/projects/${projectId}/status`, "PATCH", { status, remarks })
    }

    return (
        <StatusSheet
            meta={PROJECT_STATUS_META}
            currentStatus={currentStatus}
            options={STATUS_OPTIONS}
            isTerminal={false}
            onConfirm={handleConfirm}
            onUpdated={onUpdated}
        />
    )
}
