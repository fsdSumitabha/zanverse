import clsx from "clsx"
import { Search, X } from "lucide-react-native"
import { Pressable, TextInput, View } from "react-native"

import { FIELD_CLASSES } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import { PALETTE } from "@/theme"

interface Props {
    value: string
    onChangeText: (text: string) => void
    placeholder?: string
    autoFocus?: boolean
}

enableIconClassNames(Search, X)

/**
 * The in-screen search box. The web searches from its header SearchBar, which has no place on a phone. The list hook
 * debounces what is typed here.
 */
export default function SearchField({ value, onChangeText, placeholder = "Search", autoFocus = false }: Props) {
    return (
        <View className="justify-center">
            <View className="absolute left-3 z-10" pointerEvents="none">
                <Search size={16} className="text-neutral-400" />
            </View>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={PALETTE["neutral-400"]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                autoFocus={autoFocus}
                accessibilityLabel={placeholder}
                className={clsx(FIELD_CLASSES, "pl-9 pr-11")}
            />
            {value.length > 0 && (
                <Pressable
                    onPress={() => onChangeText("")}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    className="absolute right-0 h-11 w-11 items-center justify-center"
                >
                    <X size={16} className="text-neutral-500 dark:text-neutral-400" />
                </Pressable>
            )}
        </View>
    )
}
