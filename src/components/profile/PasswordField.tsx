import { Eye, EyeOff } from "lucide-react-native"
import { Pressable, Text, TextInput, View } from "react-native"

import { FIELD_CLASSES } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import { PALETTE } from "@/theme"

interface Props {
    label: string
    value: string
    onChange: (value: string) => void
    autoComplete: "current-password" | "new-password"
    isShown: boolean
    onToggleShow: () => void
}

enableIconClassNames(Eye, EyeOff)

/** A password box with its own eye toggle. Ported from the PasswordField helper in the web's profile edit page. */
export default function PasswordField({ label, value, onChange, autoComplete, isShown, onToggleShow }: Props) {
    return (
        <View className="gap-1">
            <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{label}</Text>
            <View className="justify-center">
                <TextInput
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!isShown}
                    autoComplete={autoComplete}
                    textContentType={autoComplete === "current-password" ? "password" : "newPassword"}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel={label}
                    placeholderTextColor={PALETTE["neutral-400"]}
                    className={`${FIELD_CLASSES} pr-12`}
                />
                <Pressable
                    onPress={onToggleShow}
                    accessibilityRole="button"
                    accessibilityLabel={isShown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    className="absolute right-0 h-11 w-11 items-center justify-center"
                >
                    {isShown ? (
                        <EyeOff size={16} className="text-neutral-500" />
                    ) : (
                        <Eye size={16} className="text-neutral-500" />
                    )}
                </Pressable>
            </View>
        </View>
    )
}
