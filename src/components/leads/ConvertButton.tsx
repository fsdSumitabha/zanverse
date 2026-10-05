import { SquaresIntersect } from "lucide-react-native"
import { Pressable, Text } from "react-native"

import { PALETTE } from "@/theme"

interface Props {
    onPress: () => void
}

/**
 * "Convert To Client", shown on a lead at status 50. Ported from the web's ConvertClientButton.tsx. On a phone it is a
 * full-width row of its own, not the web's overlay on the contact lines, so it never covers text.
 */
export default function ConvertButton({ onPress }: Props) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="Convert To Client"
            className="min-h-[44px] flex-row items-center justify-center gap-1 rounded-md bg-green-600 px-3 py-2 active:bg-green-700"
        >
            <Text className="text-xs font-medium text-white">Convert To Client</Text>
            <SquaresIntersect size={14} strokeWidth={2} color={PALETTE.white} />
        </Pressable>
    )
}
