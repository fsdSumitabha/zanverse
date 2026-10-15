import { X } from "lucide-react-native"
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import {
    Animated,
    BackHandler,
    Easing,
    Keyboard,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    type KeyboardEvent,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PALETTE } from "@/theme"

import { useDialogLayer } from "./DialogHost"

interface Props {
    open: boolean
    onClose: () => void
    title: string
    description?: ReactNode
    children: ReactNode
    /** The button row at the bottom, usually Buttons: quiet "Cancel", then the primary action. */
    footer?: ReactNode
}

type SurfaceProps = Omit<Props, "open">

// Material 3's basic dialog: at most 560 dp wide, kept 24 dp from the screen's edges, over a 32% black scrim.
const MAX_WIDTH = 560
const EDGE_GAP = 24
const SCRIM_COLOR = "rgba(0, 0, 0, 0.32)"
// The card grows from 90% as it fades in.
const START_SCALE = 0.9
// Material 3's emphasized decelerate easing, as the floating tab bar uses.
const ENTER_TIMING = { duration: 250, easing: Easing.bezier(0.05, 0.7, 0.1, 1), useNativeDriver: true }
// Material 3 elevation level 3.
const CARD_SHADOW = {
    elevation: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
}
const CLOSE_ICON_SIZE = 20

/** The keyboard's height while it is open, else 0. */
function useKeyboardHeight(): number {
    const [height, setHeight] = useState(0)

    useEffect(() => {
        const show = Keyboard.addListener("keyboardDidShow", (event: KeyboardEvent) =>
            setHeight(event.endCoordinates.height),
        )
        const hide = Keyboard.addListener("keyboardDidHide", () => setHeight(0))
        return () => {
            show.remove()
            hide.remove()
        }
    }, [])

    return height
}

/**
 * The space the keyboard and the navigation bar take at the bottom of the window. Android reports the keyboard without
 * the navigation bar under it; iOS measures it from the screen's bottom edge.
 */
function getBottomCover(keyboardHeight: number, bottomInset: number): number {
    if (keyboardHeight === 0) return bottomInset
    return Platform.OS === "android" ? keyboardHeight + bottomInset : keyboardHeight
}

/** The scrim and the card, centred in the space the system bars and the keyboard leave free. */
function DialogSurface({ onClose, title, description, children, footer }: SurfaceProps) {
    const insets = useSafeAreaInsets()
    const keyboardHeight = useKeyboardHeight()
    const progress = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(progress, { toValue: 1, ...ENTER_TIMING }).start()
    }, [progress])

    const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [START_SCALE, 1] })
    const frameStyle = {
        paddingTop: insets.top + EDGE_GAP,
        paddingBottom: getBottomCover(keyboardHeight, insets.bottom) + EDGE_GAP,
        paddingLeft: insets.left + EDGE_GAP,
        paddingRight: insets.right + EDGE_GAP,
    }

    return (
        <View style={StyleSheet.absoluteFill}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
                <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.frame, frameStyle]}>
                <Animated.View
                    accessibilityViewIsModal
                    accessibilityLabel={title}
                    className="bg-white dark:bg-neutral-900"
                    style={[styles.card, CARD_SHADOW, { opacity: progress, transform: [{ scale }] }]}
                >
                    <View className="flex-row items-start gap-2 pl-6 pr-3 pt-4">
                        <View className="min-w-0 flex-1 pt-2">
                            <Text
                                accessibilityRole="header"
                                className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                            >
                                {title}
                            </Text>
                            {typeof description === "string" ? (
                                <Text className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{description}</Text>
                            ) : (
                                description
                            )}
                        </View>
                        <Pressable
                            onPress={onClose}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            className="h-[44px] w-[44px] items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
                        >
                            <X size={CLOSE_ICON_SIZE} color={PALETTE["neutral-400"]} />
                        </Pressable>
                    </View>

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                    >
                        {children}
                    </ScrollView>

                    {footer && <View className="flex-row flex-wrap justify-end gap-2 px-6 pb-6 pt-2">{footer}</View>}
                </Animated.View>
            </View>
        </View>
    )
}

/**
 * A Material 3 basic dialog: a card centred on the screen over a scrim, with a title, a description, a scrolling body
 * and a button row. It is the web's lead-sources Dialog. It draws on the DialogHost layer, so it covers the whole
 * window wherever it is written. It closes the keyboard as it opens, and rises above the keyboard while one of its own
 * fields is typed in, so its buttons stay on screen; a tall body scrolls instead. The scrim, the X and the Android back
 * button call onClose; the owner keeps the open state.
 */
export default function Dialog({ open, ...surfaceProps }: Props) {
    const layer = useDialogLayer()
    const key = useId()
    const onCloseRef = useRef(surfaceProps.onClose)
    onCloseRef.current = surfaceProps.onClose
    const surface = open ? <DialogSurface {...surfaceProps} /> : null

    // A keyboard left open by the form behind would cover the dialog. A field in the dialog opens it again on a tap.
    useEffect(() => {
        if (open) Keyboard.dismiss()
    }, [open])

    // The newest listener is asked first, so back closes a picker opened over the dialog before the dialog.
    useEffect(() => {
        if (!open) return
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            onCloseRef.current()
            return true
        })
        return () => subscription.remove()
    }, [open])

    // After every render, so the layer always draws the current content.
    useEffect(() => {
        if (!layer) return
        if (surface) layer.show(key, surface)
        else layer.hide(key)
    })

    useEffect(() => () => layer?.hide(key), [layer, key])

    return layer ? null : surface
}

const styles = StyleSheet.create({
    scrim: {
        backgroundColor: SCRIM_COLOR,
    },
    frame: {
        alignItems: "center",
        justifyContent: "center",
    },
    // 28 dp corners: Material 3's extra-large shape. The card stops at the free space, and the body then scrolls.
    card: {
        width: "100%",
        maxWidth: MAX_WIDTH,
        maxHeight: "100%",
        borderRadius: 28,
    },
    body: {
        flexShrink: 1,
    },
    bodyContent: {
        gap: 16,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
})
