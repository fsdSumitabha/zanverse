import { Search } from "lucide-react-native"
import { Pressable } from "react-native"

import { navigationRef } from "@/api/navigationRef"
import { enableIconClassNames } from "@/lib/iconClassName"

enableIconClassNames(Search)

/** The Dashboard header's search icon. It opens the global Search screen, the phone's form of the web's SearchBar. */
export default function HeaderSearchButton() {
    function open() {
        navigationRef.navigate("App", { screen: "DashboardTab", params: { screen: "Search", initial: false } })
    }

    return (
        <Pressable
            onPress={open}
            accessibilityRole="button"
            accessibilityLabel="Search"
            hitSlop={8}
            className="h-11 w-11 items-center justify-center"
        >
            <Search size={22} className="text-neutral-700 dark:text-neutral-200" />
        </Pressable>
    )
}
