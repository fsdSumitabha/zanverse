import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import type { ReactNode } from "react"

/**
 * Where every Sheet draws: above everything inside it, so a sheet opened from a tab covers the tab bar and the header.
 * Mount it inside the NavigationContainer and the app providers. A sheet's content is drawn here, not where the sheet
 * is written, so it only sees the context above this provider.
 */
export default function SheetProvider({ children }: { children: ReactNode }) {
    return <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
}
