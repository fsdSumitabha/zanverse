// LEGACY. Unused by RN. Copied from the web for parity only, and nothing in the app may import it.
// It is built on the web's old STRING unions from src/config/services.ts and src/config/statuses.ts, from before
// the numeric codes. RN has no src/config, so both unions are inlined here in place of those imports. The numeric
// Service enum in @/constants/services is a different thing.
import { Interaction } from "./interaction"

type Service = "Web Development" | "Digital Marketing" | "BlockChain" | "Mobile APP" | "SEO"
type Status =
    | "NEW LEAD"
    | "CONTACTED"
    | "MEETING SCHEDULED"
    | "DISCUSSION"
    | "NEGOTIATION"
    | "ACTIVE"
    | "IN PROGRESS"
    | "MAINTENANCE"
    | "COMPLETED"

export interface Contact {
    name: string
    company: string
    service: Service
    status: Status
    interaction: Interaction
}