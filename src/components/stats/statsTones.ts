/** The web OverallStatsPanel's TONE map: the icon tile classes and the accent text classes of each colour. */
export const TONE = {
    emerald: {
        icon: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        accentText: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
        icon: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
        accentText: "text-amber-600 dark:text-amber-400",
    },
    blue: {
        icon: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
        accentText: "text-blue-600 dark:text-blue-400",
    },
    rose: {
        icon: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
        accentText: "text-rose-600 dark:text-rose-400",
    },
    purple: {
        icon: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
        accentText: "text-purple-600 dark:text-purple-400",
    },
} as const

export type Tone = keyof typeof TONE

/** The web's card frame, shared by every overall-stats card. */
export const STATS_CARD_CLASSES =
    "rounded-lg dark:rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5"
