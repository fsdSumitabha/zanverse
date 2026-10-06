import { Inbox } from "lucide-react-native"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ActivityIndicator, SectionList, Text, View, useColorScheme } from "react-native"

import { sendRaw } from "@/api/client"
import { SEARCH_API } from "@/api/endpoints"
import SearchResultRow from "@/components/dashboard/SearchResultRow"
import SearchField from "@/components/list/SearchField"
import { useAuth } from "@/contexts/AuthContext"
import { hrefToScreen } from "@/lib/entityNav"
import { enableIconClassNames } from "@/lib/iconClassName"
import { PALETTE } from "@/theme"
import type { SearchData, SearchEntity, SearchHit, SearchResponse } from "@/types/search"

interface Section {
    label: string
    type: SearchEntity
    data: SearchHit[]
}

const DEBOUNCE_MS = 300
const MIN_QUERY = 2
const RESULT_LIMIT = 10
const PLACEHOLDER = "Search leads, clients, projects, meetings…"

enableIconClassNames(Inbox)

// The web's section order. Users stays out: the route leaves that search commented out.
function getSections(data: SearchData | null): Section[] {
    if (!data) return []
    const sections: Section[] = [
        { label: "Leads", type: "LEAD", data: data.leads },
        { label: "Clients", type: "CLIENT", data: data.clients },
        { label: "Projects", type: "PROJECT", data: data.projects },
        { label: "Meetings", type: "MEETING", data: data.meetings },
    ]
    return sections.filter((section) => section.data.length > 0)
}

/**
 * Global search across leads, clients, projects and meetings. It asks from two characters on, 300 ms after the last
 * key, and drops an answer that arrives after a newer one. Ported from the dashboard mode of the web's SearchBar and
 * its SearchResults.
 */
export default function SearchScreen() {
    const { role } = useAuth()
    const isDarkMode = useColorScheme() === "dark"
    const [value, setValue] = useState("")
    const [results, setResults] = useState<SearchData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const reqIdRef = useRef(0)
    const term = value.trim()

    useEffect(() => {
        if (term.length < MIN_QUERY) {
            // A newer key press makes any answer still on its way out of date.
            reqIdRef.current++
            setResults(null)
            setError(null)
            setIsLoading(false)
            return
        }

        const handle = setTimeout(async () => {
            const id = ++reqIdRef.current
            setIsLoading(true)
            setError(null)
            try {
                const json = await sendRaw<SearchResponse>(
                    `${SEARCH_API}?search=${encodeURIComponent(term)}&limit=${RESULT_LIMIT}`,
                    "GET",
                )
                if (id !== reqIdRef.current) return
                if (!json.success || !json.data) throw new Error(json.message || "Search failed")
                setResults(json.data)
            } catch (caught) {
                if (id !== reqIdRef.current) return
                setError(caught instanceof Error ? caught.message : "Search failed")
                setResults(null)
            } finally {
                if (id === reqIdRef.current) setIsLoading(false)
            }
        }, DEBOUNCE_MS)

        return () => clearTimeout(handle)
    }, [term])

    const sections = useMemo(() => getSections(results), [results])

    function openHit(hit: SearchHit) {
        if (!hrefToScreen(hit.href, role)) {
            console.warn(`Search: no screen for ${hit.href}`)
            return
        }
        setValue("")
        setResults(null)
    }

    let status: ReactNode = null
    if (term.length >= MIN_QUERY) {
        if (isLoading && (!results || results.total === 0)) {
            status = (
                <View className="flex-row items-center gap-2 px-4 py-4">
                    <ActivityIndicator
                        size="small"
                        color={isDarkMode ? PALETTE["neutral-400"] : PALETTE["neutral-500"]}
                    />
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">Searching…</Text>
                </View>
            )
        } else if (error) {
            status = <Text className="px-4 py-4 text-sm text-red-600 dark:text-red-300">{error}</Text>
        } else if (results && results.total === 0) {
            status = (
                <View className="items-center px-4 py-6">
                    <Inbox size={24} className="mb-1 text-neutral-400" />
                    <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                        {`No results for “${term}”`}
                    </Text>
                </View>
            )
        }
    }

    return (
        <View className="flex-1">
            <View className="p-4 pb-2">
                <SearchField value={value} onChangeText={setValue} placeholder={PLACEHOLDER} autoFocus />
            </View>
            {status ?? (
                <SectionList
                    sections={sections}
                    keyExtractor={(hit) => `${hit.type}-${hit.id}`}
                    renderItem={({ item }) => <SearchResultRow hit={item} onSelect={openHit} />}
                    renderSectionHeader={({ section }) => (
                        <Text
                            accessibilityRole="header"
                            className="bg-neutral-50 px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:bg-neutral-950 dark:text-neutral-500"
                        >
                            {section.label}
                        </Text>
                    )}
                    stickySectionHeadersEnabled
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                />
            )}
        </View>
    )
}
