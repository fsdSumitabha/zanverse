import type { NativeStackNavigationOptions } from "@react-navigation/native-stack"

import { SCREEN_TITLES } from "./screenTitles"
import type { AppScreenName } from "./types"

/** Options every tab's stack shares: the screen's title from SCREEN_TITLES. */
export function getStackScreenOptions({ route }: { route: { name: string } }): NativeStackNavigationOptions {
    return {
        title: SCREEN_TITLES[route.name as AppScreenName] ?? route.name,
    }
}
