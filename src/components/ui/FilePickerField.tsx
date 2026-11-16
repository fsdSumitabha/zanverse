import { errorCodes, isErrorWithCode, pick } from "@react-native-documents/picker"
import clsx from "clsx"
import { Upload, X } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"

/** A picked file, ready to append to FormData as `{ uri, name, type }`. */
export interface PickedFile {
    uri: string
    name: string
    type: string
    size: number | null
}

interface Props {
    label: string
    file: PickedFile | null
    onChange: (file: PickedFile | null) => void
    /** MIME types, exact or with a wildcard such as `audio/*`. */
    acceptedTypes: string[]
    /** Bytes. */
    maxSize: number
}

enableIconClassNames(Upload, X)

function isAccepted(type: string, acceptedTypes: string[]): boolean {
    return acceptedTypes.some((accepted) =>
        accepted.endsWith("/*") ? type.startsWith(accepted.slice(0, -1)) : type === accepted,
    )
}

/** The rejection text the web's react-dropzone shows, so both apps say the same thing. */
export function getFileRejection(
    file: { type: string; size: number | null },
    acceptedTypes: string[],
    maxSize: number,
) {
    if (!isAccepted(file.type, acceptedTypes)) {
        const list = acceptedTypes.length > 1 ? `one of ${acceptedTypes.join(", ")}` : acceptedTypes[0]
        return `File type must be ${list}`
    }
    if (file.size !== null && file.size > maxSize) {
        return `File is larger than ${maxSize} ${maxSize === 1 ? "byte" : "bytes"}`
    }
    return null
}

/**
 * One optional file, replacing the web's dropzone/FileUpload.tsx: the system file picker, filtered to the allowed
 * types, then the same type and size checks and messages as the web before anything is uploaded.
 */
export default function FilePickerField({ label, file, onChange, acceptedTypes, maxSize }: Props) {
    const [rejection, setRejection] = useState<string | null>(null)

    async function handlePick() {
        try {
            const [picked] = await pick({ type: acceptedTypes })
            const candidate: PickedFile = {
                uri: picked.uri,
                name: picked.name ?? "file",
                type: picked.type ?? "application/octet-stream",
                size: picked.size,
            }
            const message = getFileRejection(candidate, acceptedTypes, maxSize)
            if (message) {
                setRejection(`${candidate.name}: ${message}`)
                onChange(null)
                return
            }
            setRejection(null)
            onChange(candidate)
        } catch (error) {
            if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return
            setRejection(error instanceof Error ? error.message : "Could not open the file")
        }
    }

    return (
        <View>
            <Pressable
                onPress={handlePick}
                accessibilityRole="button"
                accessibilityLabel={file ? `${label}: ${file.name}` : label}
                className="items-center rounded-lg border-2 border-dashed border-neutral-300 p-4 active:bg-neutral-50 dark:rounded-xl dark:border-neutral-700 dark:active:bg-neutral-800"
            >
                <Upload size={20} className="mb-2 text-neutral-600 dark:text-neutral-400" />
                <Text className="text-center text-sm text-gray-500 dark:text-gray-400">{label}</Text>
                {file && <Text className="mt-2 text-xs text-green-600">{file.name}</Text>}
                {rejection && <Text className="mt-2 text-center text-xs text-red-600">{rejection}</Text>}
            </Pressable>
            {file && (
                <Pressable
                    onPress={() => onChange(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove file"
                    className={clsx("mt-1 min-h-[44px] flex-row items-center justify-center gap-1 self-end px-2")}
                >
                    <X size={14} className="text-neutral-500" />
                    <Text className="text-xs text-neutral-500">Remove</Text>
                </Pressable>
            )}
        </View>
    )
}
