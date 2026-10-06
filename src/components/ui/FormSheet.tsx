import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModalProvider,
    BottomSheetScrollView,
    type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet"
import { X } from "lucide-react-native"
import { useEffect, useMemo, useRef, type ReactNode } from "react"
import { BackHandler, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PALETTE } from "@/theme"

import { InSheetContext } from "./SheetTextInput"

interface Props {
    title: string
    /** Called once the sheet has closed: by a drag, the backdrop, the X or the back button. Usually goBack. */
    onClose: () => void
    children: ReactNode
}

const SNAP_POINTS = ["90%"]
const HANDLE_WIDTH = 40
const BOTTOM_GAP = 16

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
 * A timeline form (note, call, quotation, meeting) as a sheet at 90% of the screen over the record it belongs to. Its
 * inputs tell the sheet about the keyboard, so typing pushes the sheet up instead of hiding the Save button. The route
 * stays a route: the screen is a transparent modal and this sheet is all it draws.
 *
 * It has its own SheetProvider, so a picker opened from the form draws above the form, also where the modal screen
 * sits above the app's own provider.
 */
export default function FormSheet({ title, onClose, children }: Props) {
    const ref = useRef<BottomSheet>(null)
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose
    const insets = useSafeAreaInsets()
    const isDarkMode = useColorScheme() === "dark"

    // Back slides the sheet down first; its onClose then leaves the route. A picker on top registers later and closes
    // before this.
    useEffect(() => {
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            ref.current?.close()
            return true
        })
        return () => subscription.remove()
    }, [])

    const backgroundStyle = useMemo(
        () => ({ backgroundColor: isDarkMode ? PALETTE["neutral-900"] : PALETTE.white }),
        [isDarkMode],
    )
    const handleIndicatorStyle = useMemo(
        () => ({ width: HANDLE_WIDTH, backgroundColor: isDarkMode ? PALETTE["neutral-700"] : PALETTE["neutral-300"] }),
        [isDarkMode],
    )
    const contentStyle = useMemo(() => [styles.content, { paddingBottom: insets.bottom + BOTTOM_GAP }], [insets.bottom])

    return (
        <BottomSheetModalProvider>
            <BottomSheet
                ref={ref}
                index={0}
                snapPoints={SNAP_POINTS}
                enableDynamicSizing={false}
                enablePanDownToClose
                onClose={() => onCloseRef.current()}
                topInset={insets.top}
                backdropComponent={renderBackdrop}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
                backgroundStyle={backgroundStyle}
                handleIndicatorStyle={handleIndicatorStyle}
            >
                <View
                    accessibilityViewIsModal
                    accessibilityLabel={title}
                    className="flex-row items-center justify-between gap-3 border-b border-neutral-100 px-4 pb-3 pt-1 dark:border-neutral-800"
                >
                    <Text
                        accessibilityRole="header"
                        className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                        {title}
                    </Text>
                    <Pressable
                        onPress={() => ref.current?.close()}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                        hitSlop={10}
                        className="h-11 w-11 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-800"
                    >
                        <X size={20} color={PALETTE["neutral-400"]} />
                    </Pressable>
                </View>
                <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={contentStyle}>
                    <InSheetContext.Provider value>{children}</InSheetContext.Provider>
                </BottomSheetScrollView>
            </BottomSheet>
        </BottomSheetModalProvider>
    )
}

// The sheet's scroll view is not a core component, so the old "gap-4 p-4" is written as a style.
const styles = StyleSheet.create({
    content: {
        gap: 16,
        padding: 16,
    },
})
