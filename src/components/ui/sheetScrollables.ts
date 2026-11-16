import { BottomSheetFlatList, BottomSheetScrollView } from "@gorhom/bottom-sheet"
import { cssInterop } from "nativewind"

// The sheet's own scroll views let a drag scroll the list or move the sheet, whichever the finger means. They are not
// core components, so NativeWind is told how to map their classes, as it does for ScrollView and FlatList.
cssInterop(BottomSheetScrollView, { className: "style", contentContainerClassName: "contentContainerStyle" })
cssInterop(BottomSheetFlatList, { className: "style", contentContainerClassName: "contentContainerStyle" })

/** ScrollView and FlatList for content inside a Sheet. Use them only there: they need the sheet around them. */
export { BottomSheetFlatList as SheetFlatList, BottomSheetScrollView as SheetScrollView }
