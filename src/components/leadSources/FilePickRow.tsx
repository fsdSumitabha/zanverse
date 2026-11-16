import { FileSpreadsheet, X } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { Button } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import { sizeText, type PickedSheet } from "@/lib/leadSourceUpload"

interface Props {
    file: PickedSheet | null
    maxFileMb: number
    maxRows: number
    disabled: boolean
    onPick: () => void
    onClear: () => void
}

enableIconClassNames(FileSpreadsheet, X)

/**
 * The phone's replacement for the web's dropzone: one "Choose a file" button, then a chip with the file's name and
 * size and an X that clears it.
 */
export default function FilePickRow({ file, maxFileMb, maxRows, disabled, onPick, onClear }: Props) {
    if (!file) {
        return (
            <View className="items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-5 dark:border-neutral-700">
                <Button
                    label="Choose a file"
                    variant="quiet"
                    onPress={onPick}
                    disabled={disabled}
                    testID="uploadPickFile"
                />
                <Text className="text-center text-sm text-neutral-700 dark:text-neutral-300">
                    An .xlsx or .csv file.
                </Text>
                <Text className="text-center text-xs text-neutral-500">
                    Up to {maxRows.toLocaleString("en-US")} rows and {maxFileMb} MB.
                </Text>
            </View>
        )
    }

    return (
        <View className="flex-row items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-neutral-700">
            <FileSpreadsheet size={28} className="text-emerald-600" />
            <Pressable onPress={onPick} disabled={disabled} accessibilityRole="button" className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {file.name}
                </Text>
                <Text className="text-xs text-neutral-500">{sizeText(file.size)} · tap to choose another file</Text>
            </Pressable>
            <Pressable
                onPress={onClear}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel="Remove the file"
                className="h-11 w-11 items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-800"
            >
                <X size={18} className="text-neutral-400" />
            </Pressable>
        </View>
    )
}
