import type { ReactNode } from "react"
import { KeyboardAvoidingView, Modal, Pressable, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface Props {
    visible: boolean
    onClose: () => void
    /** Read by screen readers. */
    accessibilityLabel: string
    /** Lift the sheet above the keyboard. Dialog sets it, so a field is never under the keyboard. */
    avoidKeyboard?: boolean
    children: ReactNode
}

/**
 * The bottom sheet under SelectSheet and Dialog: a dimmed backdrop and a panel at the bottom with the web's sheet
 * handle (lead-sources/Popover.tsx on a phone). The Android back button and a tap on the backdrop both close it.
 *
 * The modal draws under the status and navigation bars, so the panel pads itself by the bottom inset and stays clear
 * of the gesture bar.
 */
export default function Sheet({ visible, onClose, accessibilityLabel, avoidKeyboard = false, children }: Props) {
    const insets = useSafeAreaInsets()

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView behavior="padding" enabled={avoidKeyboard} className="flex-1 justify-end">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    onPress={onClose}
                    className="absolute inset-0 bg-black/50"
                />
                <View
                    accessibilityViewIsModal
                    accessibilityLabel={accessibilityLabel}
                    className="max-h-[85%] rounded-t-2xl bg-white dark:bg-neutral-900"
                    style={{ paddingBottom: insets.bottom }}
                >
                    <View className="mx-auto mt-2 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                    {children}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}
