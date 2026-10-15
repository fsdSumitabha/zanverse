import { useHeaderHeight } from "@react-navigation/elements"
import type { ReactNode } from "react"
import { KeyboardAvoidingView, ScrollView } from "react-native"

import { useBottomClearance } from "@/hooks/useBottomClearance"

interface Props {
    children: ReactNode
}

const BOTTOM_GAP = 16

/**
 * The scrolling body of a form screen under a stack header. It lifts above the keyboard (edge-to-edge is on, so
 * Android no longer shrinks the window for it), keeps taps on buttons while the keyboard is open, and clears the
 * gesture bar (useBottomClearance).
 */
export default function FormScrollView({ children }: Props) {
    const headerHeight = useHeaderHeight()
    const bottomClearance = useBottomClearance()

    return (
        <KeyboardAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={headerHeight}>
            <ScrollView
                contentContainerClassName="gap-4 p-4"
                contentContainerStyle={{ paddingBottom: bottomClearance + BOTTOM_GAP }}
                keyboardShouldPersistTaps="handled"
            >
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
