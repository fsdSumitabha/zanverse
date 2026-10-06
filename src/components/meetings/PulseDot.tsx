import clsx from "clsx"
import { useEffect, useRef } from "react"
import { Animated, View } from "react-native"

export type DotColor = "green" | "red" | "orange"

interface Props {
    color: DotColor
}

// The web's animate-ping: the ring grows to twice the dot and fades out, once a second.
const PING_MS = 1000
const DOT_TONES: Record<DotColor, { ring: string; dot: string }> = {
    green: { ring: "bg-green-400", dot: "bg-green-500" },
    red: { ring: "bg-red-400", dot: "bg-red-500" },
    orange: { ring: "bg-orange-400", dot: "bg-orange-500" },
}

/** The pulsing dot in a meeting card's corner: green today or upcoming, red when overdue, orange when rescheduled. */
export default function PulseDot({ color }: Props) {
    const progress = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const loop = Animated.loop(Animated.timing(progress, { toValue: 1, duration: PING_MS, useNativeDriver: true }))
        loop.start()
        return () => loop.stop()
    }, [progress])

    const ringStyle = {
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }),
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
    }

    return (
        <View accessible accessibilityLabel={`${color} status dot`} className="absolute left-2 top-2 h-2 w-2">
            <Animated.View className={clsx("absolute h-2 w-2 rounded-full", DOT_TONES[color].ring)} style={ringStyle} />
            <View className={clsx("h-2 w-2 rounded-full", DOT_TONES[color].dot)} />
        </View>
    )
}
