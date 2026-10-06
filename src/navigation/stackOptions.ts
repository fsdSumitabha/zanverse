import type { NativeStackNavigationOptions } from "@react-navigation/native-stack"
import { createElement } from "react"

import HeaderBell from "@/components/notifications/HeaderBell"

import { SCREEN_TITLES } from "./screenTitles"
import type { AppScreenName } from "./types"

function renderHeaderBell() {
    return createElement(HeaderBell)
}

/** Options every tab's stack shares: the screen's title from SCREEN_TITLES, and the notification bell on the right. */
export function getStackScreenOptions({ route }: { route: { name: string } }): NativeStackNavigationOptions {
    return {
        title: SCREEN_TITLES[route.name as AppScreenName] ?? route.name,
        headerRight: renderHeaderBell,
    }
}
