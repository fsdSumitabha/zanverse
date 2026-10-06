import { Text, View } from "react-native"

import { SECTION_TITLE } from "./listItems"
import { SECTION_HEIGHT } from "./rowLayout"

const SECTION_STYLE = { height: SECTION_HEIGHT }

/** A Today section header: "Callbacks due now", "Today" or "Left over from earlier days". Opaque, as it sticks. */
export default function ListSectionHeader({ section }: { section: number }) {
    const title = SECTION_TITLE[section]
    return (
        <View
            accessibilityRole="header"
            className="justify-center border-b border-slate-100 bg-slate-50 px-3 dark:border-neutral-800 dark:bg-neutral-800"
            style={SECTION_STYLE}
        >
            <Text className={`text-[11px] font-semibold uppercase tracking-wide ${title.tone}`}>{title.text}</Text>
        </View>
    )
}
