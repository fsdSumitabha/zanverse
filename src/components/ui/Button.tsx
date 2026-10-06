import clsx from "clsx"
import type { LucideIcon } from "lucide-react-native"
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from "react-native"

import { toNativeClasses, type NativeClasses } from "@/lib/nativeClasses"
import { PALETTE } from "@/theme"

export type ButtonVariant = "primary" | "danger" | "quiet" | "soft"

interface Props {
    label: string
    onPress: () => void
    variant?: ButtonVariant
    icon?: LucideIcon
    /** Shows a spinner in place of the icon and blocks presses. */
    loading?: boolean
    disabled?: boolean
    /** Why the button cannot be used now, such as "Offline" from useOfflineReason. It disables the button and follows
     * the label: "Save · Offline". */
    disabledReason?: string
    /** Extra classes for the pressable container, such as "flex-1" or "self-start". */
    className?: string
    accessibilityLabel?: string
}

// From the web: BUTTON_PRIMARY, BUTTON_DANGER and BUTTON_QUIET in lead-sources/Dialog.tsx, and the soft variant of
// CreateActionButton.tsx (base classes, then the variant's), without the hover, focus, cursor and transition classes
// a phone has no use for. The press feel is the ripple and active:scale below. toNativeClasses splits the rest
// between the Pressable and its Text.
const WEB_BUTTON_CLASSES: Record<ButtonVariant, string> = {
    primary:
        "inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50",
    danger: "inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50",
    quiet: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 disabled:opacity-50",
    soft: "w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-medium active:scale-[0.98] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-100 shadow-sm",
}

const BUTTON_CLASSES: Record<ButtonVariant, NativeClasses> = {
    primary: toNativeClasses(WEB_BUTTON_CLASSES.primary),
    danger: toNativeClasses(WEB_BUTTON_CLASSES.danger),
    quiet: toNativeClasses(WEB_BUTTON_CLASSES.quiet),
    soft: toNativeClasses(WEB_BUTTON_CLASSES.soft),
}

// The phone's pressed feel, in place of the web's hover colours. 44 dp is the minimum touch target.
const PRESSABLE_CLASSES = "flex-row min-h-[44px] active:scale-[0.98]"

// CreateActionButton puts its icon in a small tinted square.
const SOFT_ICON_CHIP = "h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 dark:bg-blue-500/20"

// The web's shadow-sm on the soft variant, as Android elevation.
const SOFT_SHADOW = { elevation: 1 }

const ICON_SIZE = 16

interface VariantColors {
    content: string
    ripple: string
}

function getVariantColors(variant: ButtonVariant, isDarkMode: boolean): VariantColors {
    if (variant === "primary" || variant === "danger") {
        return { content: PALETTE.white, ripple: "rgba(255, 255, 255, 0.25)" }
    }
    if (variant === "soft") {
        return {
            content: isDarkMode ? PALETTE["blue-400"] : PALETTE["blue-600"],
            ripple: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
        }
    }
    return {
        content: isDarkMode ? PALETTE["neutral-200"] : PALETTE["neutral-700"],
        ripple: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
    }
}

/**
 * The four web button styles, with a spinner for `loading`, the Android ripple on press, and a printed reason when it
 * cannot be used.
 */
export default function Button({
    label,
    onPress,
    variant = "primary",
    icon: Icon,
    loading = false,
    disabled = false,
    disabledReason,
    className,
    accessibilityLabel,
}: Props) {
    const isDarkMode = useColorScheme() === "dark"
    const isBlocked = disabled || loading || Boolean(disabledReason)
    const shownLabel = disabledReason ? `${label} · ${disabledReason}` : label
    const classes = BUTTON_CLASSES[variant]
    const colors = getVariantColors(variant, isDarkMode)

    function renderLeading() {
        if (loading) return <ActivityIndicator size="small" color={colors.content} />
        if (!Icon) return null
        const icon = <Icon size={ICON_SIZE} color={colors.content} />
        return variant === "soft" ? <View className={SOFT_ICON_CHIP}>{icon}</View> : icon
    }

    return (
        <Pressable
            onPress={onPress}
            disabled={isBlocked}
            accessibilityRole="button"
            accessibilityLabel={
                disabledReason ? `${accessibilityLabel ?? label}, ${disabledReason}` : accessibilityLabel ?? label
            }
            accessibilityState={{ disabled: isBlocked, busy: loading }}
            android_ripple={{ color: colors.ripple }}
            className={clsx(classes.container, PRESSABLE_CLASSES, isBlocked && "opacity-50", className)}
            style={variant === "soft" ? SOFT_SHADOW : undefined}
        >
            {renderLeading()}
            <Text numberOfLines={1} className={classes.text}>
                {shownLabel}
            </Text>
        </Pressable>
    )
}
