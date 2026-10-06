/**
 * The lead source sheet columns: key, label and kind, in the web's order.
 *
 * Copied from the web's src/config/leadSourceSheet.ts (LEAD_SOURCE_COLUMNS). Only the fields the phone reads are
 * kept: the header aliases, `required`, `inList` and `searchable` are server concerns. When a column is added or
 * renamed there, copy it here too, or the details screen shows it as an "(extra column)".
 */

export type ColumnKind = "text" | "phone" | "email" | "date" | "country"

export interface SheetColumn {
    key: string
    label: string
    kind: ColumnKind
}

export const LEAD_SOURCE_COLUMNS: readonly SheetColumn[] = [
    { key: "domain_name", label: "Domain", kind: "text" },
    { key: "create_date", label: "Domain created", kind: "date" },
    { key: "expiry_date", label: "Domain expires", kind: "date" },
    { key: "domain_company_name", label: "Domain company", kind: "text" },
    { key: "name", label: "Name", kind: "text" },
    { key: "company", label: "Company", kind: "text" },
    { key: "address", label: "Address", kind: "text" },
    { key: "city", label: "City", kind: "text" },
    { key: "state", label: "State", kind: "text" },
    { key: "zip", label: "ZIP", kind: "text" },
    { key: "country", label: "Country", kind: "country" },
    { key: "email", label: "Email", kind: "email" },
    { key: "phone", label: "Phone", kind: "phone" },
]
