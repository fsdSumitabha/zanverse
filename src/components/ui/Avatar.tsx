import { User } from "lucide-react-native"
import { useState } from "react"
import { Image, View, useColorScheme } from "react-native"

import { getImagekitUrl } from "@/lib/imagekitUrl"
import { PALETTE } from "@/theme"

interface Props {
    /** The user's `avatar`: an ImageKit URL, a legacy relative path, or "" when they have none. */
    uri?: string | null
    /** Rendered width and height, in points. */
    size?: number
    /** The person's name, for screen readers. */
    name?: string
    /** Put in front of a legacy relative URL. Session 4 passes the API base URL. */
    baseUrl?: string
}

const DEFAULT_SIZE = 40
const FALLBACK_CLASSES = "items-center justify-center overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"

interface FallbackProps {
    size: number
    label: string
}

function AvatarFallback({ size, label }: FallbackProps) {
    const isDarkMode = useColorScheme() === "dark"
    return (
        <View
            accessibilityRole="image"
            accessibilityLabel={label}
            className={FALLBACK_CLASSES}
            style={{ width: size, height: size }}
        >
            <User size={Math.round(size * 0.55)} color={isDarkMode ? PALETTE["neutral-400"] : PALETTE["neutral-500"]} />
        </View>
    )
}

interface AvatarImageProps {
    source: string
    size: number
    label: string
}

/** Keyed by the URL in Avatar, so a new URL gets a fresh try after an earlier one failed. */
function AvatarImage({ source, size, label }: AvatarImageProps) {
    const [isBroken, setIsBroken] = useState(false)
    if (isBroken) return <AvatarFallback size={size} label={label} />

    return (
        <Image
            source={{ uri: source }}
            onError={() => setIsBroken(true)}
            accessibilityRole="image"
            accessibilityLabel={label}
            className="rounded-full bg-neutral-200 dark:bg-neutral-700"
            style={{ width: size, height: size }}
        />
    )
}

/** A round avatar from ImageKit, sized for the screen. A missing or broken image shows the User icon instead. */
export default function Avatar({ uri, size = DEFAULT_SIZE, name, baseUrl }: Props) {
    const source = getImagekitUrl(uri, size, baseUrl)
    const label = name ? `${name}'s photo` : "Photo"

    if (!source) return <AvatarFallback size={size} label={label} />
    return <AvatarImage key={source} source={source} size={size} label={label} />
}
