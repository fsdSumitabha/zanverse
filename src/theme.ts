import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native"
import { createElement } from "react"
import { StatusBar, useColorScheme } from "react-native"

// Theme values that JS has to pass as plain colours: React Navigation, the status bar, and props NativeWind cannot
// reach (ActivityIndicator, placeholderTextColor, android_ripple). Everything else is Tailwind classes.

/** The web's `themeColor` in src/app/layout.tsx: the browser bar colour in light and dark mode. */
export const BRAND_COLOR = {
    light: "#4A6FA5",
    dark: "#183668",
} as const

/** Tailwind 3.4 colours that JS-only props need, by the class name the web uses for them. */
export const PALETTE = {
    white: "#ffffff",
    black: "#000000",
    "gray-100": "#f3f4f6",
    "gray-200": "#e5e7eb",
    "gray-800": "#1f2937",
    "neutral-50": "#fafafa",
    "neutral-100": "#f5f5f5",
    "neutral-200": "#e5e5e5",
    "neutral-300": "#d4d4d4",
    "neutral-400": "#a3a3a3",
    "neutral-500": "#737373",
    "neutral-600": "#525252",
    "neutral-700": "#404040",
    "neutral-800": "#262626",
    "neutral-900": "#171717",
    "neutral-950": "#0a0a0a",
    "blue-400": "#60a5fa",
    "blue-500": "#3b82f6",
    "blue-600": "#2563eb",
    "red-400": "#f87171",
    "red-500": "#ef4444",
    "amber-400": "#fbbf24",
    "amber-600": "#d97706",
} as const

/**
 * For NavigationContainer in session 5. Surfaces match the web's pages: neutral-50 / neutral-950 behind,
 * white / neutral-900 cards. The dark primary is blue-400, not BRAND_COLOR.dark: #183668 on a neutral-900 tab bar
 * is about 1.5:1 contrast, which is unreadable for an active tab label.
 */
export const NAVIGATION_THEME: Record<"light" | "dark", Theme> = {
    light: {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            primary: BRAND_COLOR.light,
            background: PALETTE["neutral-50"],
            card: PALETTE.white,
            text: PALETTE["neutral-900"],
            border: PALETTE["gray-200"],
        },
    },
    dark: {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            primary: PALETTE["blue-400"],
            background: PALETTE["neutral-950"],
            card: PALETTE["neutral-900"],
            text: PALETTE["neutral-100"],
            border: PALETTE["neutral-800"],
        },
    },
}

/** The navigation theme for the current OS colour scheme. */
export function useNavigationTheme(): Theme {
    return NAVIGATION_THEME[useColorScheme() === "dark" ? "dark" : "light"]
}

/**
 * Dark icons on a light screen, light icons on a dark one. Edge-to-edge is on, so the bar itself is transparent and
 * only the icon colour changes. (This file is .ts, so it builds the element without JSX.)
 */
export function ThemedStatusBar() {
    const isDarkMode = useColorScheme() === "dark"
    return createElement(StatusBar, { barStyle: isDarkMode ? "light-content" : "dark-content" })
}
