import { BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { cssInterop } from "nativewind"
import { createContext, useContext, type ComponentProps, type ComponentRef, type Ref } from "react"
import { TextInput, type TextInputProps } from "react-native"

// The sheet's input is not a core component, so NativeWind would drop the field classes on it without this.
cssInterop(BottomSheetTextInput, { className: "style" })

/** True inside a Sheet or a FormSheet. Inputs read it to pick the keyboard-aware input. */
export const InSheetContext = createContext(false)

// The sheet's input forwards its ref to the same TextInput; only its declared ref type differs.
type SheetInputRef = ComponentProps<typeof BottomSheetTextInput>["ref"]

interface Props extends TextInputProps {
    ref?: Ref<ComponentRef<typeof TextInput>>
}

/**
 * A TextInput that tells a surrounding bottom sheet about the keyboard, so the sheet rises with it instead of being
 * covered. Outside a sheet it is a plain TextInput: the sheet's input needs the sheet around it.
 */
export default function SheetTextInput({ ref, ...rest }: Props) {
    const isInSheet = useContext(InSheetContext)
    if (isInSheet) return <BottomSheetTextInput ref={ref as SheetInputRef} {...rest} />
    return <TextInput ref={ref} {...rest} />
}
