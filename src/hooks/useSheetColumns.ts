import { useEffect, useState } from "react"

import { send } from "@/api/client"
import { LEAD_SOURCE_COLUMNS_API } from "@/api/endpoints"
import { LEAD_SOURCE_SHEET_RULES } from "@/constants/leadSourceSheet"

export interface SheetColumnInfo {
    key: string
    label: string
    headers: string[]
    required?: boolean
}

interface SheetRules {
    maxFileMb: number
    maxRows: number
}

/**
 * The expected header row and the upload limits, from the server's leadSourceSheet.ts, so the phone never shows a
 * stale copy. The route is BACKEND_CHANGES.md item 6. Until it exists, `columns` stays null and the limits fall
 * back to the local copy.
 */
export function useSheetColumns() {
    const [columns, setColumns] = useState<SheetColumnInfo[] | null>(null)
    const [rules, setRules] = useState<SheetRules>(LEAD_SOURCE_SHEET_RULES)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false
        send<{ columns: SheetColumnInfo[]; rules: SheetRules }>(LEAD_SOURCE_COLUMNS_API, "GET")
            .then((data) => {
                if (isCancelled || !data?.columns) return
                setColumns(data.columns)
                if (data.rules) setRules(data.rules)
            })
            .catch(() => undefined)
            .finally(() => {
                if (!isCancelled) setIsLoading(false)
            })
        return () => {
            isCancelled = true
        }
    }, [])

    return { columns, rules, isLoading }
}
