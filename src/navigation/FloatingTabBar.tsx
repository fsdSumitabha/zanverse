import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import clsx from "clsx"
import { useEffect, useMemo, useRef, useState } from "react"
import { Animated, Easing, Keyboard, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { enableIconClassNames } from "@/lib/iconClassName"

import { BAR_BOTTOM_GAP, BAR_HEIGHT } from "./barLayout"
import { NAV_ITEMS, type NavItem } from "./navItems"

interface Props extends BottomTabBarProps {
    /** The role's bar items, in order. The other tabs open from the profile sheet. */
    items: NavItem[]
}

type TabRoute = BottomTabBarProps["state"]["routes"][number]

const ITEM_WIDTH = 76
const BAR_PADDING = 6
const SIDE_MARGIN = 16
const ICON_SIZE = 24
const INDICATOR_SIZE = { width: 56, height: 32 }
// The pill grows out from the icon, as Material 3's active indicator does.
const INDICATOR_START_SCALE = 0.4
// Extra travel when the bar slides away, so its shadow leaves the screen too.
const SHADOW_ROOM = 16

// Material 3 Expressive's fast spatial spring (stiffness 800, damping ratio 0.6): a small overshoot.
const INDICATOR_SPRING = { stiffness: 800, damping: 34, mass: 1, useNativeDriver: true }
// Material 3's emphasized easing: decelerate on the way in, accelerate on the way out.
const SHOW_TIMING = { duration: 250, easing: Easing.bezier(0.05, 0.7, 0.1, 1), useNativeDriver: true }
const HIDE_TIMING = { duration: 200, easing: Easing.bezier(0.3, 0, 0.8, 0.15), useNativeDriver: true }

// Material 3 elevation level 3, so the bar reads above the white cards it floats over.
const BAR_SHADOW = {
    elevation: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
}

enableIconClassNames(...NAV_ITEMS.map((item) => item.icon))

// The bar shows on a tab's first screen only. A pushed screen, such as a lead, gets the whole height.
function isOnFirstScreen(route: TabRoute): boolean {
    const nested = route.state
    if (!nested) return true
    return (nested.index ?? nested.routes.length - 1) === 0
}

// The keyboard covers the bar on most phones, but a phone that resizes the window would lift the bar onto it.
function useIsKeyboardVisible(): boolean {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const show = Keyboard.addListener("keyboardDidShow", () => setIsVisible(true))
        const hide = Keyboard.addListener("keyboardDidHide", () => setIsVisible(false))
        return () => {
            show.remove()
            hide.remove()
        }
    }, [])

    return isVisible
}

interface ItemProps {
    item: NavItem
    isFocused: boolean
    onPress: () => void
    onLongPress: () => void
}

function BarItem({ item, isFocused, onPress, onLongPress }: ItemProps) {
    const [isPressed, setIsPressed] = useState(false)
    const progress = useRef(new Animated.Value(isFocused ? 1 : 0)).current
    const Icon = item.icon

    useEffect(() => {
        Animated.spring(progress, { toValue: isFocused ? 1 : 0, ...INDICATOR_SPRING }).start()
    }, [isFocused, progress])

    const indicatorStyle = useMemo(
        () => ({
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }),
            transform: [
                { scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [INDICATOR_START_SCALE, 1] }) },
            ],
        }),
        [progress],
    )

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            accessibilityRole="tab"
            accessibilityLabel={item.name}
            accessibilityState={{ selected: isFocused }}
            className="items-center justify-center gap-1"
            style={styles.item}
        >
            <View className="items-center justify-center" style={INDICATOR_SIZE}>
                <Animated.View
                    className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-400/25"
                    style={indicatorStyle}
                />
                {/* Material 3's pressed state layer, on the indicator's shape. */}
                {isPressed && !isFocused && (
                    <View className="absolute inset-0 rounded-full bg-neutral-900/10 dark:bg-white/10" />
                )}
                <Icon
                    size={ICON_SIZE}
                    className={
                        isFocused ? "text-blue-800 dark:text-blue-100" : "text-neutral-600 dark:text-neutral-400"
                    }
                />
            </View>
            <Text
                numberOfLines={1}
                className={clsx(
                    "text-xs",
                    isFocused
                        ? "font-semibold text-blue-800 dark:text-blue-200"
                        : "font-medium text-neutral-600 dark:text-neutral-400",
                )}
            >
                {item.name}
            </Text>
        </Pressable>
    )
}

/**
 * The floating navigation bar (docs/navigation-architecure.md): a Material 3 Expressive pill over the content, holding
 * the role's bar tabs. It shows on a tab's list and slides away on a pushed screen, a tab outside the bar and while the
 * keyboard is up. Screens under it keep clear with useBottomClearance.
 */
export default function FloatingTabBar({ state, navigation, items }: Props) {
    const insets = useSafeAreaInsets()
    const { width } = useWindowDimensions()
    const isKeyboardVisible = useIsKeyboardVisible()
    const focusedRoute = state.routes[state.index]
    const isShown =
        !isKeyboardVisible && items.some((item) => item.tab === focusedRoute.name) && isOnFirstScreen(focusedRoute)
    const hiddenProgress = useRef(new Animated.Value(isShown ? 0 : 1)).current

    useEffect(() => {
        Animated.timing(hiddenProgress, { toValue: isShown ? 0 : 1, ...(isShown ? SHOW_TIMING : HIDE_TIMING) }).start()
    }, [hiddenProgress, isShown])

    if (items.length === 0) return null

    const travel = BAR_HEIGHT + BAR_BOTTOM_GAP + insets.bottom + SHADOW_ROOM
    const translateY = hiddenProgress.interpolate({ inputRange: [0, 1], outputRange: [0, travel] })

    function handlePress(route: TabRoute, isFocused: boolean) {
        // A stack pops to its list when its focused tab is pressed again, through this event.
        const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
        if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params)
    }

    return (
        <Animated.View
            pointerEvents={isShown ? "box-none" : "none"}
            accessibilityElementsHidden={!isShown}
            importantForAccessibility={isShown ? "auto" : "no-hide-descendants"}
            style={[styles.overlay, { bottom: insets.bottom + BAR_BOTTOM_GAP, transform: [{ translateY }] }]}
        >
            <View
                accessibilityRole="tablist"
                className="flex-row items-center rounded-full bg-white dark:bg-neutral-800"
                style={[
                    BAR_SHADOW,
                    { height: BAR_HEIGHT, paddingHorizontal: BAR_PADDING, maxWidth: width - SIDE_MARGIN * 2 },
                ]}
            >
                {items.map((item) => {
                    const route = state.routes.find((candidate) => candidate.name === item.tab)
                    if (!route) return null
                    const isFocused = route.key === focusedRoute.key
                    return (
                        <BarItem
                            key={route.key}
                            item={item}
                            isFocused={isFocused}
                            onPress={() => handlePress(route, isFocused)}
                            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
                        />
                    )
                })}
            </View>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
    },
    item: {
        flexBasis: ITEM_WIDTH,
        flexShrink: 1,
        height: BAR_HEIGHT,
    },
})
