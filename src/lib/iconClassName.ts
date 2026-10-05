import type { LucideIcon } from "lucide-react-native"
import { cssInterop } from "nativewind"

/**
 * Lets lucide icons take their colour from a Tailwind class, as the web's do: `className="text-amber-600
 * dark:text-amber-400"`. A lucide icon draws with its `color` prop and ignores className, so NativeWind moves the
 * class's `color` into that prop. Size stays the `size` prop. Call once per icon, at module level.
 */
export function enableIconClassNames(...icons: LucideIcon[]): void {
    for (const icon of icons) {
        cssInterop(icon, { className: { target: "style", nativeStyleToProp: { color: true } } })
    }
}
