import { useNavigation, useRoute } from "@react-navigation/native"
import { useEffect } from "react"

/**
 * Applies filters that arrive as route params, such as the dashboard opening the Clients list on status 1, then
 * clears them, so the same link works again later. Keys with no value are ignored.
 */
export function useRouteFilterParams(keys: readonly string[], apply: (patch: Record<string, string>) => void) {
    const navigation = useNavigation()
    const params = (useRoute().params ?? {}) as Record<string, string | undefined>
    const patch = Object.fromEntries(keys.filter((key) => params[key]).map((key) => [key, params[key] as string]))
    const patchKey = JSON.stringify(patch)

    useEffect(() => {
        const next = JSON.parse(patchKey) as Record<string, string>
        if (Object.keys(next).length === 0) return
        apply(next)
        navigation.setParams(Object.fromEntries(Object.keys(next).map((key) => [key, undefined])) as never)
        // `apply` is the list's stable setFilters; the params are the trigger.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patchKey])
}
