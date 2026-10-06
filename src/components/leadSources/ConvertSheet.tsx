import { Text, View } from "react-native"

import { Button, Dialog } from "@/components/ui"

interface Props {
    name: string
    assigneeName: string | null
    isConverting: boolean
    onClose: () => void
    onConfirm: () => void
}

/** The confirm step before a source becomes a lead. The web's convert Dialog, word for word. */
export default function ConvertSheet({ name, assigneeName, isConverting, onClose, onConfirm }: Props) {
    const bullets = [
        "The lead gets the name, phone, email and region.",
        `It is assigned to ${assigneeName || "you"}.`,
        "Everything else from the sheet, and every note from the calls, goes into its first note.",
        "This source is then marked Converted and closed.",
    ]

    return (
        <Dialog
            open
            onClose={() => !isConverting && onClose()}
            title={`Convert ${name} to a lead?`}
            description="A new lead is created in the Leads list, in this region."
            footer={
                <>
                    <Button label="Cancel" variant="quiet" onPress={onClose} disabled={isConverting} />
                    <Button
                        label={isConverting ? "Creating..." : "Create lead"}
                        onPress={onConfirm}
                        disabled={isConverting}
                    />
                </>
            }
        >
            <View className="gap-1">
                {bullets.map((line) => (
                    <View key={line} className="flex-row gap-2">
                        <Text className="text-sm text-neutral-600 dark:text-neutral-300">•</Text>
                        <Text className="flex-1 text-sm text-neutral-600 dark:text-neutral-300">{line}</Text>
                    </View>
                ))}
            </View>
        </Dialog>
    )
}
