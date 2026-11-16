// Copied from the `OverallStats` interface in the web's components/admin/operations/OverallStatsPanel.tsx, where the
// web keeps it. One correction: `leads.conversionRate` is `number | null`, because the route's computeOverallStats.ts
// returns null while no lead is converted or lost. Re-copy when the web changes.

/** One month of `leads.overTime`. The API sends only months that have leads. */
export interface MonthBucket {
    month: number // 1–12
    leads: number
    converted: number
}

/** One year of `leads.overTime`, with its months. */
export interface YearBucket {
    year: number
    leads: number
    converted: number
    months: MonthBucket[]
}

export interface OverallStats {
    leads: {
        total: number
        byStatus: Record<string, number>
        active: number
        converted: number
        lost: number
        conversionRate: number | null
        overTime: YearBucket[]
    }
    clients: {
        total: number
        byStatus: {
            active: number
            inactive: number
            onHold: number
            completed: number
        }
    }
    projects: {
        total: number
        byStatus: Record<string, number>
        pipeline: number
        running: number
        closed: number
        totalBudgetRunning: number
    }
    meetings: {
        total: number
        byStatus: Record<string, number>
        today: number
        thisWeek: number
        upcoming: number
    }
    users: {
        total: number
        active: number
        inactive: number
        byRole: Record<string, number>
    }
    updatedAt: string
}
