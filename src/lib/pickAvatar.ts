import { launchCamera, launchImageLibrary } from "react-native-image-picker"

import type { PickedImage } from "./userDiff"

// The avatar route's own rules and words (users/route.ts and profile/avatar/route.ts).
const ACCEPTED_TYPES = ["image/jpeg", "image/png"]
const MAX_BYTES = 5 * 1024 * 1024
const TYPE_BY_EXTENSION: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" }
// iOS photos are often HEIC, which the server refuses: "compatible" hands over a JPEG copy. Android ignores it.
const LIBRARY_OPTIONS = { mediaType: "photo", selectionLimit: 1, assetRepresentationMode: "compatible" } as const

/** "820 B", "48.2 KB", "1.3 MB". Verbatim from the web's AvatarPreview. */
export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * The server's refusal for an image it would not take, checked before any request. Null when it is fine. The users
 * route says "Invalid file type"; the profile route says "Invalid file type (JPEG or PNG only)".
 */
export function getAvatarRejection(
    type: string,
    size: number,
    invalidTypeMessage = "Invalid file type",
): string | null {
    if (!ACCEPTED_TYPES.includes(type)) return invalidTypeMessage
    if (size > MAX_BYTES) return "File too large (max 5MB)"
    return null
}

interface PickOptions {
    /** The photo library (default) or the camera. */
    source?: "library" | "camera"
    invalidTypeMessage?: string
}

/**
 * Opens the photo library, or the camera, for one image and checks it. Resolves null when the person cancels; throws an Error with
 * the server's wording for a type or size the server would refuse. The MIME type falls back to the file extension
 * when the picker gives none.
 */
export async function pickAvatarImage({
    source = "library",
    invalidTypeMessage,
}: PickOptions = {}): Promise<PickedImage | null> {
    const result =
        source === "camera"
            ? await launchCamera({ mediaType: "photo", saveToPhotos: false })
            : await launchImageLibrary(LIBRARY_OPTIONS)
    if (result.didCancel) return null
    if (result.errorCode) throw new Error(result.errorMessage || "Could not open the photos")

    const asset = result.assets?.[0]
    if (!asset?.uri) return null
    const name = asset.fileName || asset.uri.split("/").pop() || "avatar.jpg"
    const extension = name.split(".").pop()?.toLowerCase() ?? ""
    const type = asset.type || TYPE_BY_EXTENSION[extension] || ""
    const size = asset.fileSize ?? 0

    const rejection = getAvatarRejection(type, size, invalidTypeMessage)
    if (rejection) throw new Error(rejection)
    return { uri: asset.uri, name, type, size }
}
