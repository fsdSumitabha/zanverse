import { ImageIcon, Pencil, Trash2 } from "lucide-react-native"
import { useState } from "react"
import { Image, Pressable, Text, View } from "react-native"

import { Avatar, Button } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import { formatSize, pickAvatarImage } from "@/lib/pickAvatar"
import type { PickedImage } from "@/lib/userDiff"

interface Props {
    /** The saved avatar URL, or "". */
    avatar: string
    file: PickedImage | null
    onPick: (file: PickedImage) => void
    onRemove: () => void
    disabled?: boolean
}

const PREVIEW_SIZE = 96
const PREVIEW_STYLE = { width: PREVIEW_SIZE, height: PREVIEW_SIZE }

enableIconClassNames(ImageIcon, Pencil, Trash2)

/**
 * The avatar block of the user form, replacing the web's dropzone and AvatarPreview: "Choose image" opens the photo
 * library, then a round preview with Replace and Remove. JPEG and PNG up to 5 MB, refused in the app with the server's
 * words before anything is sent.
 */
export default function AvatarField({ avatar, file, onPick, onRemove, disabled = false }: Props) {
    const [rejection, setRejection] = useState<string | null>(null)

    async function choose() {
        try {
            const picked = await pickAvatarImage()
            if (!picked) return
            setRejection(null)
            onPick(picked)
        } catch (error) {
            setRejection(error instanceof Error ? error.message : "Could not open the photos")
        }
    }

    const hasImage = !!file || !!avatar

    return (
        <View className="gap-3 rounded-lg bg-gray-50 p-4 dark:bg-neutral-800/50">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Avatar</Text>
            {!hasImage ? (
                <Button label="Choose image" variant="quiet" onPress={choose} disabled={disabled} />
            ) : (
                <View className="items-center gap-3">
                    <View>
                        {file ? (
                            <Image
                                source={{ uri: file.uri }}
                                accessibilityLabel="Avatar preview"
                                className="rounded-full border border-gray-200 dark:border-neutral-700"
                                style={PREVIEW_STYLE}
                            />
                        ) : (
                            <Avatar uri={avatar} size={PREVIEW_SIZE} name="Current avatar" />
                        )}
                        <Pressable
                            onPress={choose}
                            disabled={disabled}
                            accessibilityRole="button"
                            accessibilityLabel="Replace image"
                            className="absolute -bottom-1 -right-1 h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <Pencil size={14} className="text-gray-700 dark:text-gray-300" />
                        </Pressable>
                    </View>
                    <View className="w-full flex-row items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 dark:bg-neutral-800">
                        <ImageIcon size={16} className="text-gray-500 dark:text-gray-400" />
                        <View className="min-w-0 flex-1">
                            <Text numberOfLines={1} className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {file?.name || "Current avatar"}
                            </Text>
                            {file && (
                                <Text className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {formatSize(file.size)}
                                </Text>
                            )}
                        </View>
                        <Pressable
                            onPress={onRemove}
                            disabled={disabled}
                            accessibilityRole="button"
                            accessibilityLabel="Remove avatar"
                            className="h-11 w-11 items-center justify-center rounded-full active:bg-red-50 dark:active:bg-red-500/10"
                        >
                            <Trash2 size={14} className="text-red-500" />
                        </Pressable>
                    </View>
                </View>
            )}
            {!!rejection && <Text className="text-xs text-red-600 dark:text-red-400">{rejection}</Text>}
        </View>
    )
}
