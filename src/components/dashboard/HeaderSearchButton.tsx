import { Search } from "lucide-react-native"
import { Pressable } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"
import { openPage } from "@/navigation/openPage"

enableIconClassNames(Search)

/** The search icon on a tab's top bar. It opens the global Search page, the phone's form of the web's SearchBar. */
export default function HeaderSearchButton() {
    function open() {
        openPage("Search")
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
