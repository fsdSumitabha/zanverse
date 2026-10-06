import type { NativeStackNavigationOptions } from "@react-navigation/native-stack"
import { createElement } from "react"
import { View } from "react-native"

import HeaderSearchButton from "@/components/dashboard/HeaderSearchButton"
import HeaderBell from "@/components/notifications/HeaderBell"
import HeaderAvatar from "@/components/profile/HeaderAvatar"

import { SCREEN_TITLES } from "./screenTitles"
import type { AppScreenName } from "./types"

const HEADER_ACTIONS_STYLE = { flexDirection: "row", alignItems: "center" } as const

// The web's top bar, right side: the notification bell, then the profile menu.
function renderHeaderActions() {
    return createElement(View, { style: HEADER_ACTIONS_STYLE }, createElement(HeaderBell), createElement(HeaderAvatar))
}

// The Dashboard's top bar adds the global search before the bell.
function renderDashboardActions() {
    return createElement(
        View,
        { style: HEADER_ACTIONS_STYLE },
        createElement(HeaderSearchButton),
        createElement(HeaderBell),
        createElement(HeaderAvatar),
    )
}

/** The Dashboard screen's header: the search icon, then the bell and the profile menu. */
export const DASHBOARD_SCREEN_OPTIONS: NativeStackNavigationOptions = { headerRight: renderDashboardActions }

/** Options every tab's stack shares: the title from SCREEN_TITLES, and the bell and the profile menu on the right. */
export function getStackScreenOptions({ route }: { route: { name: string } }): NativeStackNavigationOptions {
    return {
        title: SCREEN_TITLES[route.name as AppScreenName] ?? route.name,
        headerRight: renderHeaderActions,
    }
}
