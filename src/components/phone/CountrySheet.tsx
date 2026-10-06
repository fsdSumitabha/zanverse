import clsx from "clsx"
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js"
import { Check } from "lucide-react-native"
import { useMemo, useState } from "react"
import { Pressable, Text, View } from "react-native"

import SearchField from "@/components/list/SearchField"
import { Sheet } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import { REGION_CODES, REGIONS } from "@/lib/region"
import { SheetFlatList } from "@/components/ui/sheetScrollables"

interface Props {
    visible: boolean
    value: CountryCode
    onSelect: (country: CountryCode) => void
    onClose: () => void
}

interface CountryRow {
    code: CountryCode
    name: string
    callingCode: string
    isSuggested: boolean
}

enableIconClassNames(Check)

// Region names come from src/lib/region.ts. Other names come from Intl when the engine has it, else the code alone.
function getDisplayNames(): { of: (code: string) => string | undefined } | null {
    try {
        const DisplayNames = (
            Intl as unknown as {
                DisplayNames?: new (...args: unknown[]) => { of: (code: string) => string | undefined }
            }
        ).DisplayNames
        return DisplayNames ? new DisplayNames(["en"], { type: "region" }) : null
    } catch {
        return null
    }
}

function buildRows(): CountryRow[] {
    const displayNames = getDisplayNames()
    const suggested = REGION_CODES as readonly string[]
    const toRow = (code: CountryCode): CountryRow => ({
        code,
        name: (suggested.includes(code) ? REGIONS[code as keyof typeof REGIONS].label : displayNames?.of(code)) ?? code,
        callingCode: `+${getCountryCallingCode(code)}`,
        isSuggested: suggested.includes(code),
    })
    const rest = getCountries()
        .filter((code) => !suggested.includes(code))
        .map(toRow)
        .sort((a, b) => a.name.localeCompare(b.name))
    return [...REGION_CODES.map((code) => toRow(code as CountryCode)), ...rest]
}

/**
 * The phone field's country list: the three regions first (the web's "Suggested" group), then every other country.
 * Each row shows the calling code, so the person sees it is already set.
 */
export default function CountrySheet({ visible, value, onSelect, onClose }: Props) {
    const [search, setSearch] = useState("")
    const rows = useMemo(buildRows, [])

    const term = search.trim().toLowerCase()
    const visibleRows = term
        ? rows.filter(
              (row) =>
                  row.name.toLowerCase().includes(term) ||
                  row.code.toLowerCase() === term ||
                  row.callingCode.includes(term.replace(/^\+?/, "+")),
          )
        : rows

    return (
        <Sheet visible={visible} onClose={onClose} accessibilityLabel="Country">
            <View className="gap-3 px-5 pb-2 pt-3">
                <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Country</Text>
                <SearchField value={search} onChangeText={setSearch} placeholder="Search countries" />
            </View>
            <SheetFlatList
                data={visibleRows}
                keyExtractor={(row) => row.code}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item, index }) => {
                    const isSelected = item.code === value
                    const isFirstOfRest = !term && index === REGION_CODES.length
                    return (
                        <Pressable
                            onPress={() => onSelect(item.code)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            className={clsx(
                                "min-h-[48px] flex-row items-center gap-3 px-5 py-3 active:bg-neutral-100 dark:active:bg-neutral-800",
                                isFirstOfRest && "border-t border-gray-200 dark:border-neutral-800",
                            )}
                        >
                            <Text className="w-10 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                {item.code}
                            </Text>
                            <Text numberOfLines={1} className="flex-1 text-sm text-neutral-800 dark:text-neutral-100">
                                {item.name}
                            </Text>
                            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{item.callingCode}</Text>
                            {isSelected && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                        </Pressable>
                    )
                }}
            />
        </Sheet>
    )
}
