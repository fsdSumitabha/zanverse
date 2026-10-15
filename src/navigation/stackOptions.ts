import type { NativeStackHeaderProps, NativeStackNavigationOptions } from "@react-navigation/native-stack"
import { createElement } from "react"

import { SCREEN_TITLES } from "./screenTitles"
import TopAppBar from "./TopAppBar"
import type { AppScreenName } from "./types"

function renderHeader(props: NativeStackHeaderProps) {
    return createElement(TopAppBar, props)
}

/** Options every tab's stack shares: the title from SCREEN_TITLES, drawn by the Material 3 top app bar. */
export function getStackScreenOptions({ route }: { route: { name: string } }): NativeStackNavigationOptions {
    return {
        title: SCREEN_TITLES[route.name as AppScreenName] ?? route.name,
        header: renderHeader,
    }
}
