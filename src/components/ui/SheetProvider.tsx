import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import type { ReactNode } from "react"

import DialogHost from "./DialogHost"

/**
 * Where every Sheet and Dialog draws: above everything inside it, so a sheet opened from a tab covers the tab bar and
 * the header. Dialogs draw under the sheets, so a picker opened from a dialog shows over it. Mount it inside the
 * NavigationContainer and the app providers. A sheet's or a dialog's content is drawn here, not where it is written,
 * so it only sees the context above this provider.
 */
export default function SheetProvider({ children }: { children: ReactNode }) {
    return (
        <BottomSheetModalProvider>
            <DialogHost>{children}</DialogHost>
        </BottomSheetModalProvider>
    )
}
