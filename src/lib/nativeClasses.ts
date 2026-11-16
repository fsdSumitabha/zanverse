// Turns a web class string into the two halves React Native needs. On the web one string styles a <button> and the
// text inside it. In React Native the container is a View or Pressable and the text is a <Text>, and text classes on
// a View do not reach the Text. Keeping the web string verbatim and splitting it here means a re-copy is one paste.

export interface NativeClasses {
    /** Layout, background, border, padding: for the View or Pressable. */
    container: string
    /** Font size, weight and colour: for the Text inside. */
    text: string
}

// Variants that only exist with a mouse or a keyboard. A phone has no hover and no focus ring.
const WEB_ONLY_VARIANTS = ["hover:", "group-hover:", "focus:", "focus-visible:", "focus-within:", "disabled:"]

// Utilities with no React Native meaning. `disabled:` is handled by the component (it adds opacity-50 itself), and
// shadows become `elevation`, because Android draws no CSS shadow on these views.
const WEB_ONLY_UTILITIES = [
    /^group$/,
    /^inline-flex$/,
    /^inline-block$/,
    /^block$/,
    /^transition/,
    /^duration-/,
    /^ease-/,
    /^cursor-/,
    /^outline-/,
    /^ring-/,
    /^select-/,
    /^whitespace-/,
    /^shadow/,
    /^placeholder:/,
]

const TEXT_UTILITIES = [/^text-/, /^font-/, /^leading-/, /^tracking-/, /^italic$/, /^underline$/, /^uppercase$/]

/** The utility without its `dark:` or `active:` prefixes, so `dark:text-white` is read as `text-white`. */
function getBaseUtility(token: string): string {
    return token.slice(token.lastIndexOf(":") + 1)
}

/**
 * Splits a web class string into container and text classes, dropping what has no meaning on a phone.
 * Alignment classes (`text-center`, `text-left`) count as text, which is where React Native applies them.
 */
export function toNativeClasses(webClasses: string): NativeClasses {
    const container: string[] = []
    const text: string[] = []

    for (const token of webClasses.split(/\s+/)) {
        if (!token) continue
        if (WEB_ONLY_VARIANTS.some((variant) => token.includes(variant))) continue
        const base = getBaseUtility(token)
        if (WEB_ONLY_UTILITIES.some((pattern) => pattern.test(token) || pattern.test(base))) continue
        if (TEXT_UTILITIES.some((pattern) => pattern.test(base))) text.push(token)
        else container.push(token)
    }

    return { container: container.join(" "), text: text.join(" ") }
}
