import { createContext, useContext } from "react"

import type { TabName } from "./types"

/** The floating bar's height: Material 3 Expressive's 64 dp navigation bar. */
export const BAR_HEIGHT = 64
/** The gap between the floating bar and the gesture bar under it. */
export const BAR_BOTTOM_GAP = 12

/** How much of a screen's bottom the floating bar covers, the gesture bar under it included. */
export function getBarOverlap(bottomInset: number): number {
    return bottomInset + BAR_BOTTOM_GAP + BAR_HEIGHT
}

/** The tabs in the floating bar, in order. TabNavigator provides it. */
export const BarTabsContext = createContext<readonly TabName[]>([])

/** The tab a screen sits in. TabNavigator provides it around each tab. */
export const TabNameContext = createContext<TabName | null>(null)

/**
 * Where the screen's tab sits: in the floating bar or not, and the bar's first tab, where Back goes from a tab outside
 * the bar when there is nothing behind it.
 */
export function useTabPlacement(): { isInBar: boolean; firstBarTab: TabName | undefined } {
    const barTabs = useContext(BarTabsContext)
    const tab = useContext(TabNameContext)
    return { isInBar: tab != null && barTabs.includes(tab), firstBarTab: barTabs[0] }
}
