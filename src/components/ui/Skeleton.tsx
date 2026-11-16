import clsx from "clsx"
import { useEffect, useRef } from "react"
import { Animated, Easing, View, type DimensionValue } from "react-native"

import Card from "./Card"

type SkeletonRounded = "sm" | "md" | "lg" | "full"

interface SkeletonBlockProps {
    width: DimensionValue
    height: number
    rounded?: SkeletonRounded
    className?: string
}

const ROUNDED_CLASSES: Record<SkeletonRounded, string> = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
}

// The web's skeleton block colour, most used across its 11 skeletons.
const BLOCK_CLASSES = "bg-gray-200 dark:bg-neutral-700"

// Tailwind's animate-pulse: a 2 s cycle, down to 0.5 opacity and back, on cubic-bezier(0.4, 0, 0.6, 1).
const PULSE_HALF_MS = 1000
const PULSE_EASING = Easing.bezier(0.4, 0, 0.6, 1)

/** One grey block that pulses like the web's `animate-pulse`. The web's skeletons are rebuilt from these. */
export function SkeletonBlock({ width, height, rounded = "sm", className }: SkeletonBlockProps) {
    const opacity = useRef(new Animated.Value(1)).current

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.5,
                    duration: PULSE_HALF_MS,
                    easing: PULSE_EASING,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: PULSE_HALF_MS,
                    easing: PULSE_EASING,
                    useNativeDriver: true,
                }),
            ]),
        )
        pulse.start()
        return () => pulse.stop()
    }, [opacity])

    return (
        <Animated.View accessibilityElementsHidden importantForAccessibility="no" style={{ opacity, width }}>
            <View className={clsx(BLOCK_CLASSES, ROUNDED_CLASSES[rounded], className)} style={{ height }} />
        </Animated.View>
    )
}

interface SkeletonListProps {
    /** How many placeholder cards to show. */
    count?: number
}

/**
 * Placeholder cards for a list that is loading, shaped like the web's LeadCardSkeleton: a title and a subtitle with
 * a badge on the right, then three short lines. Module sessions build their own shapes from SkeletonBlock.
 */
export function SkeletonList({ count = 3 }: SkeletonListProps) {
    return (
        <View accessibilityLabel="Loading" className="gap-4">
            {Array.from({ length: count }, (_, index) => (
                <Card key={index} className="gap-3 p-4">
                    <View className="flex-row items-center justify-between">
                        <View className="gap-2">
                            <SkeletonBlock width={128} height={16} />
                            <SkeletonBlock width={96} height={12} />
                        </View>
                        <SkeletonBlock width={80} height={20} rounded="full" />
                    </View>
                    <SkeletonBlock width={112} height={12} />
                    <SkeletonBlock width={144} height={12} />
                    <SkeletonBlock width="60%" height={12} />
                </Card>
            ))}
        </View>
    )
}
