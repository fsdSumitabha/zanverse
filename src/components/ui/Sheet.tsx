import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet"
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react"
import { BackHandler, useColorScheme, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PALETTE } from "@/theme"

import { InSheetContext } from "./SheetTextInput"

interface Props {
    visible: boolean
    onClose: () => void
    /** Read by screen readers. */
    accessibilityLabel: string
    /** Fixed heights such as `["90%"]`. Without them the sheet fits its content, up to 85% of the screen. */
    snapPoints?: (string | number)[]
    children: ReactNode
}

// The tallest a content-sized sheet grows. A list or a long form inside it scrolls past this.
const MAX_HEIGHT_RATIO = 0.85
const HANDLE_WIDTH = 40

function renderBackdrop(props: BottomSheetBackdropProps) {
    return (
        <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior="close"
            accessibilityLabel="Close"
        />
    )
}

/**
 * The bottom sheet under SelectSheet, Dialog and every picker: it drags, snaps, sizes itself to its content and rises
 * with the keyboard. A drag down, a tap on the backdrop and the Android back button all close it. It draws above the
 * tabs from the SheetProvider, and pads itself by the bottom inset so it clears the gesture bar.
 *
 * The owner keeps the open state, as before: `visible` presents and dismisses it, and `onClose` reports a close the
 * person made.
 */
export default function Sheet({ visible, onClose, accessibilityLabel, snapPoints, children }: Props) {
    const ref = useRef<BottomSheetModal>(null)
    const isVisibleRef = useRef(visible)
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose
    const insets = useSafeAreaInsets()
    const { height } = useWindowDimensions()
    const isDarkMode = useColorScheme() === "dark"
    const maxHeight = Math.round(height * MAX_HEIGHT_RATIO)

    useEffect(() => {
        isVisibleRef.current = visible
        if (visible) ref.current?.present()
        else ref.current?.dismiss()
    }, [visible])

    // The newest listener is asked first, so back closes the top sheet before it reaches the navigator.
    useEffect(() => {
        if (!visible) return
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            onCloseRef.current()
            return true
        })
        return () => subscription.remove()
    }, [visible])

    // A drag or a backdrop tap dismissed the sheet while its owner still has it open: report the close.
    const handleDismiss = useCallback(() => {
        if (isVisibleRef.current) onCloseRef.current()
    }, [])

    const backgroundStyle = useMemo(
        () => ({ backgroundColor: isDarkMode ? PALETTE["neutral-900"] : PALETTE.white }),
        [isDarkMode],
    )
    const handleIndicatorStyle = useMemo(
        () => ({ width: HANDLE_WIDTH, backgroundColor: isDarkMode ? PALETTE["neutral-700"] : PALETTE["neutral-300"] }),
        [isDarkMode],
    )
    // A content-sized sheet caps its content, so a list inside shrinks and scrolls; a fixed one fills its snap point.
    const contentStyle = useMemo(
        () => (snapPoints ? { flex: 1, paddingBottom: insets.bottom } : { maxHeight, paddingBottom: insets.bottom }),
        [snapPoints, maxHeight, insets.bottom],
    )

    return (
        <BottomSheetModal
            ref={ref}
            onDismiss={handleDismiss}
            snapPoints={snapPoints}
            enableDynamicSizing={!snapPoints}
            maxDynamicContentSize={maxHeight}
            enablePanDownToClose
            topInset={insets.top}
            backdropComponent={renderBackdrop}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            backgroundStyle={backgroundStyle}
            handleIndicatorStyle={handleIndicatorStyle}
        >
            <BottomSheetView accessibilityViewIsModal accessibilityLabel={accessibilityLabel} style={contentStyle}>
                <InSheetContext.Provider value>{children}</InSheetContext.Provider>
            </BottomSheetView>
        </BottomSheetModal>
    )
}
