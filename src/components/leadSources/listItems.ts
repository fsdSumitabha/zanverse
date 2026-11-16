import type { LeadSourceRow, LeadSourceView } from "@/types/leadSource"

import { getRowHeight, SECTION_HEIGHT } from "./rowLayout"

/** One entry of the flat list: a section header on Today, or a row. */
export type ListItem =
    | { kind: "section"; key: string; section: number }
    | { kind: "row"; key: string; row: LeadSourceRow }

export interface ListLayout {
    items: ListItem[]
    /** Each item's top edge, from the start of the data, so getItemLayout needs no measuring. */
    offsets: number[]
    heights: number[]
    /** The data indices of the section headers. */
    sectionIndices: number[]
}

/** The Today section titles and tones, verbatim from the web's SECTION_TITLE. */
export const SECTION_TITLE: Record<number, { text: string; tone: string }> = {
    0: { text: "Callbacks due now", tone: "text-rose-700 dark:text-rose-300" },
    1: { text: "Today", tone: "text-neutral-500 dark:text-neutral-400" },
    2: { text: "Left over from earlier days", tone: "text-amber-700 dark:text-amber-300" },
}

/**
 * Flattens the rows into one array for a FlatList. On Today a header goes before each run of rows that share a
 * `section`, in the server's order, exactly where the web draws one. Other views are rows only.
 */
export function buildListLayout(rows: LeadSourceRow[], view: LeadSourceView, today: string): ListLayout {
    const items: ListItem[] = []
    const offsets: number[] = []
    const heights: number[] = []
    const sectionIndices: number[] = []
    let top = 0

    function push(item: ListItem, height: number) {
        items.push(item)
        offsets.push(top)
        heights.push(height)
        top += height
    }

    rows.forEach((row, i) => {
        const isNewSection =
            view === "today" &&
            row.section !== undefined &&
            row.section !== rows[i - 1]?.section &&
            SECTION_TITLE[row.section] !== undefined
        if (isNewSection && row.section !== undefined) {
            sectionIndices.push(items.length)
            push({ kind: "section", key: `section-${row.section}-${i}`, section: row.section }, SECTION_HEIGHT)
        }
        push({ kind: "row", key: row._id, row }, getRowHeight(row, view, today))
    })

    return { items, offsets, heights, sectionIndices }
}
