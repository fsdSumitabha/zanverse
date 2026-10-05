import clsx from "clsx"
import { Check, ChevronDown, Globe } from "lucide-react-native"
import { useState } from "react"
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native"

import { Sheet } from "@/components/ui"
import { useRegionScope } from "@/contexts/RegionContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import { ALL_REGIONS, ALL_REGIONS_META, REGIONS, type ActiveRegion, type RegionCode } from "@/lib/region"

import { ALL_TONE, REGION_TONE } from "./tone"

interface Props {
    className?: string
}

const PILL_BASE = "flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-medium leading-none"

enableIconClassNames(Check, ChevronDown, Globe)

function getRegionLabel(code: ActiveRegion): string {
    return code === ALL_REGIONS ? ALL_REGIONS_META.label : REGIONS[code].label
}

/**
 * Switches the session between the regions the account holds. Ported from the web's RegionSwitcher.
 *
 * Someone with one region gets a plain badge with nothing to press. Someone with more gets a pill that opens a sheet:
 * "All regions" first, then each region they hold. The web's SVG flags are left out: the code and the colour say
 * the same thing.
 */
export default function RegionSwitcher({ className }: Props) {
    const { regions, active, setActive, switching, isAll, canSwitch } = useRegionScope()
    const [isOpen, setIsOpen] = useState(false)

    // Before /api/auth/me returns there is nothing true to show, and a wrong
    // region flashing on screen is worse than none.
    if (regions.length === 0) return null

    const tone = toNativeClasses(`${PILL_BASE} ${isAll ? ALL_TONE : REGION_TONE[active as RegionCode]}`)
    const label = isAll ? ALL_REGIONS_META.label : active
    const fullLabel = getRegionLabel(active)

    if (!canSwitch) {
        return (
            <View
                accessible
                accessibilityLabel={`Working in ${fullLabel}`}
                className={clsx(tone.container, "min-h-[28px]", className)}
            >
                <Text className={tone.text}>{label}</Text>
            </View>
        )
    }

    const options: ActiveRegion[] = [ALL_REGIONS, ...regions]

    function handleSelect(code: ActiveRegion) {
        setIsOpen(false)
        setActive(code)
    }

    return (
        <>
            <Pressable
                onPress={() => setIsOpen(true)}
                disabled={switching}
                accessibilityRole="button"
                accessibilityLabel={
                    isAll
                        ? `Showing every region you cover: ${regions.join(", ")}. Press to narrow.`
                        : `Working in ${fullLabel}. Press to change.`
                }
                accessibilityState={{ disabled: switching, busy: switching, expanded: isOpen }}
                hitSlop={8}
                className={clsx(tone.container, "min-h-[28px] active:opacity-80", switching && "opacity-50", className)}
            >
                {switching ? <ActivityIndicator size="small" /> : isAll && <Globe size={14} className={tone.text} />}
                <Text className={tone.text}>{label}</Text>
                <ChevronDown size={12} className={tone.text} />
            </Pressable>

            <Sheet visible={isOpen} onClose={() => setIsOpen(false)} accessibilityLabel="Switch region">
                <Text className="px-5 pb-2 pt-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    Region
                </Text>
                <FlatList
                    data={options}
                    keyExtractor={(code) => code}
                    renderItem={({ item }) => {
                        const isActive = item === active
                        return (
                            <Pressable
                                onPress={() => handleSelect(item)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isActive }}
                                className={clsx(
                                    "min-h-[48px] flex-row items-center gap-2.5 px-5 py-3 active:bg-neutral-100 dark:active:bg-neutral-800",
                                    isActive && "bg-blue-50 dark:bg-blue-500/10",
                                )}
                            >
                                <Text
                                    className={clsx(
                                        "flex-1 text-sm",
                                        isActive
                                            ? "text-blue-700 dark:text-blue-300"
                                            : "text-neutral-700 dark:text-neutral-200",
                                    )}
                                >
                                    {getRegionLabel(item)}
                                </Text>
                                {isActive && <Check size={16} className="text-blue-700 dark:text-blue-300" />}
                            </Pressable>
                        )
                    }}
                />
            </Sheet>
        </>
    )
}
