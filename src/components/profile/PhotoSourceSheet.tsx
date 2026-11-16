import { Camera, Image as ImageIcon } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { Sheet } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"

interface Props {
    visible: boolean
    onClose: () => void
    onPick: (source: "camera" | "library") => void
}

enableIconClassNames(Camera, ImageIcon)

function Row({ icon: Icon, label, onPress }: { icon: typeof Camera; label: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            className="min-h-[52px] flex-row items-center gap-3 rounded-lg px-4 active:bg-neutral-100 dark:active:bg-neutral-800"
        >
            <Icon size={20} className="text-neutral-700 dark:text-neutral-200" />
            <Text className="text-base text-neutral-800 dark:text-neutral-100">{label}</Text>
        </Pressable>
    )
}

/** Camera, Choose from gallery or Cancel: the phone's replacement for the web's hidden file input. */
export default function PhotoSourceSheet({ visible, onClose, onPick }: Props) {
    return (
        <Sheet visible={visible} onClose={onClose} accessibilityLabel="Change photo">
            <View className="gap-1 px-3 pb-3 pt-3">
                <Row icon={Camera} label="Camera" onPress={() => onPick("camera")} />
                <Row icon={ImageIcon} label="Choose from gallery" onPress={() => onPick("library")} />
                <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    className="min-h-[52px] items-center justify-center rounded-lg active:bg-neutral-100 dark:active:bg-neutral-800"
                >
                    <Text className="text-base font-medium text-neutral-500">Cancel</Text>
                </Pressable>
            </View>
        </Sheet>
    )
}
