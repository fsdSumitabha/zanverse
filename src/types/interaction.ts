// LEGACY. Unused by RN. Copied from the web for parity only, and nothing in the app may import it.
// Trap: `type` below is the web's old STRING union from src/config/interactionTypes.ts. It is NOT the numeric
// InteractionType (2010-2510) in @/constants/interactionTypes, which is what the API sends. RN has no src/config,
// so that union is inlined here in place of the import. Session 8 writes the real timeline row type.
type InteractionType = "Meeting" | "Note" | "Proposal" | "Call"

export interface Interaction {
    _id?: string;
    type: InteractionType
    title: string
    subtitle?: string
    time: string
    user: string
}