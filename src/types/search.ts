// Copied from the web's components/admin/operations/search/types.ts, where the web keeps them. Re-copy when it changes.

export type SearchEntity =
    | "LEAD"
    | "CLIENT"
    | "PROJECT"
    | "MEETING"
    | "USER"

export interface SearchHit {
    id: string
    type: SearchEntity
    title: string
    subtitle?: string
    href: string
}

export interface SearchData {
    leads: SearchHit[]
    clients: SearchHit[]
    projects: SearchHit[]
    meetings: SearchHit[]
    users: SearchHit[]
    total: number
}

export interface SearchResponse {
    success: boolean
    data?: SearchData
    message?: string
}
