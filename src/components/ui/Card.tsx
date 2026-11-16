import clsx from "clsx"
import { View, type ViewProps } from "react-native"

interface Props extends ViewProps {
    className?: string
}

const CARD_CLASSES = "rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"

// The web's shadow-sm (0 1px 2px rgb(0 0 0 / 0.05)). Android draws no CSS shadow here, so it gets elevation.
const CARD_SHADOW = {
    elevation: 1,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
}

/** The shared surface every list row, detail block and form sits on. */
export default function Card({ className, style, children, ...rest }: Props) {
    return (
        <View className={clsx(CARD_CLASSES, className)} style={[CARD_SHADOW, style]} {...rest}>
            {children}
        </View>
    )
}
