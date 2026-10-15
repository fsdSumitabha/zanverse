import { CommonActions } from "@react-navigation/native"

import { navigationRef } from "@/api/navigationRef"

import { NAV_ITEMS } from "./navItems"
import type { PageParamList, TabName } from "./types"

/**
 * Opens a page, such as Profile, over the screen you are on. Every tab's stack has the pages, and a container-level
 * action goes to the focused stack first, so Back returns to where you were. A page already open further down the
 * stack is popped back to, not opened twice.
 */
export function openPage(page: keyof PageParamList): void {
    if (!navigationRef.isReady()) return
    navigationRef.dispatch(CommonActions.navigate(page, undefined, { pop: true }))
}

/** Opens a tab on its first screen, such as Lead Sources from the profile sheet. */
export function openTab(tab: TabName): void {
    if (!navigationRef.isReady()) return
    const screen = NAV_ITEMS.find((item) => item.tab === tab)?.screen
    // The tab is a union, which React Navigation cannot check against each tab's params.
    navigationRef.navigate("App", { screen: tab, params: screen ? { screen, pop: true } : undefined } as never)
}
