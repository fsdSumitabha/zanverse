import { CommonActions, createNavigationContainerRef } from "@react-navigation/native"

import type { RootStackParamList } from "@/navigation/types"

/**
 * The navigation container's ref, so code outside a screen can move between Login and the app. `client.ts` uses it on
 * a 401 and never imports a screen.
 */

type RootRoute = "Auth" | "App"

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

// A reset asked for before the container is mounted waits here, and runs from `handleNavigationReady`.
let pendingRoute: RootRoute | null = null

function getRootRouteName(): string | undefined {
    const state = navigationRef.getRootState()
    return state?.routes[state.index]?.name
}

function resetTo(name: RootRoute): void {
    if (!navigationRef.isReady()) {
        pendingRoute = name
        return
    }
    if (getRootRouteName() === name) return
    navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name }] }))
}

/** Replaces the whole stack with Login, so Back cannot return to a signed-in screen. */
export function resetToLogin(): void {
    resetTo("Auth")
}

/** Replaces the whole stack with the signed-in app. */
export function resetToApp(): void {
    resetTo("App")
}

/** Pass to `NavigationContainer`'s `onReady`. Runs a reset that was asked for before the container mounted. */
export function handleNavigationReady(): void {
    if (!pendingRoute) return
    const name = pendingRoute
    pendingRoute = null
    resetTo(name)
}
