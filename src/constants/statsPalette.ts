// Copied from the web's components/admin/operations/OverallStatsPanel.tsx, where the web keeps these palettes.
// Unlike the numeric `*_STATUS_META` maps elsewhere in this folder, these are keyed by the string keys of the
// /overall-stats payload (`new`, `onHold`, `proposalSent`, …) and carry hex colours, because the charts need hex.
// Import them as `STATS_PALETTE` to keep them apart from the numeric maps. Re-copy when the web changes.

export interface StatusMeta {
    label: string
    color: string
}

const LEAD_STATUS_META: Record<string, StatusMeta> = {
    new: { label: "New", color: "#94a3b8" },
    contacted: { label: "Contacted", color: "#3b82f6" },
    meeting: { label: "Meeting", color: "#8b5cf6" },
    discussion: { label: "Discussion", color: "#eab308" },
    negotiation: { label: "Negotiation", color: "#f97316" },
    converted: { label: "Converted", color: "#10b981" },
    lost: { label: "Lost", color: "#ef4444" },
}

const CLIENT_STATUS_META: Record<string, StatusMeta> = {
    active: { label: "Active", color: "#10b981" },
    inactive: { label: "Inactive", color: "#94a3b8" },
    onHold: { label: "On Hold", color: "#f59e0b" },
    completed: { label: "Completed", color: "#3b82f6" },
}

const PROJECT_STATUS_META: Record<string, StatusMeta> = {
    discussion: { label: "Discussion", color: "#3b82f6" },
    proposalSent: { label: "Proposal", color: "#6366f1" },
    negotiation: { label: "Negotiation", color: "#a855f7" },
    confirmed: { label: "Confirmed", color: "#10b981" },
    inProgress: { label: "In Progress", color: "#f59e0b" },
    deployed: { label: "Deployed", color: "#06b6d4" },
    maintenance: { label: "Maintenance", color: "#ec4899" },
    closed: { label: "Closed", color: "#737373" },
}

const MEETING_STATUS_META: Record<string, StatusMeta> = {
    scheduled: { label: "Scheduled", color: "#3b82f6" },
    rescheduled: { label: "Rescheduled", color: "#f59e0b" },
    cancelled: { label: "Cancelled", color: "#ef4444" },
    missed: { label: "Missed", color: "#94a3b8" },
    completed: { label: "Completed", color: "#10b981" },
}

/** The four chart palettes of the overall-stats screen, under the web's names. */
export const STATS_PALETTE = {
    LEAD_STATUS_META,
    CLIENT_STATUS_META,
    PROJECT_STATUS_META,
    MEETING_STATUS_META,
} as const
