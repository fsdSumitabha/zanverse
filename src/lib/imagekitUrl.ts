// Image URLs for <Image>. The web renders avatars with @imagekit/next, which resizes on ImageKit's servers. The app
// asks for the same resize with ImageKit's URL transformation: `?tr=w-<n>,h-<n>,f-auto`.

/** Pixels fetched per rendered point. 2x stays sharp on most phones without downloading the full image. */
const IMAGE_SCALE = 2

const IMAGEKIT_HOST = /^https?:\/\/[^/?#]*imagekit\.io\//i
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i
const HAS_TRANSFORM = /[?&]tr=|\/tr:/

/**
 * The URL to load for an image shown at `size` points, or null when there is nothing loadable.
 *
 * - An ImageKit URL gets `tr=w-<2·size>,h-<2·size>,f-auto`, unless it already carries a transformation.
 * - A relative legacy URL, such as "/uploads/…", is served by the API, so `baseUrl` is put in front. Without a
 *   `baseUrl` it cannot load, and the result is null. (Session 4 owns the API base URL.)
 * - Any other absolute URI (another host, or a local `file:`, `content:` or `data:` image) is returned as it is.
 */
export function getImagekitUrl(url: string | null | undefined, size: number, baseUrl?: string): string | null {
    const trimmed = url?.trim()
    if (!trimmed) return null

    let absolute = trimmed
    if (!HAS_SCHEME.test(trimmed)) {
        if (!baseUrl) return null
        absolute = `${baseUrl.replace(/\/+$/, "")}/${trimmed.replace(/^\/+/, "")}`
    }

    if (!IMAGEKIT_HOST.test(absolute) || HAS_TRANSFORM.test(absolute)) return absolute

    const pixels = Math.round(size * IMAGE_SCALE)
    const separator = absolute.includes("?") ? "&" : "?"
    return `${absolute}${separator}tr=w-${pixels},h-${pixels},f-auto`
}
