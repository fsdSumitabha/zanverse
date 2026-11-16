import clsx from "clsx"
import { Check, ChevronDown, Globe, Lock } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import { RegionBadge } from "@/components/region/RegionBadges"
import { Button, Field, Sheet } from "@/components/ui"
import { canAdministerAllRegions } from "@/constants/userRoles"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { REGION_CODES, REGIONS, type RegionCode } from "@/lib/region"

interface Props {
    value: RegionCode[]
    onChange: (next: RegionCode[]) => void
    /** Regions the account already holds. Used when editing. */
    existing?: RegionCode[]
    disabled?: boolean
    /** Shown instead of the control: "you cannot edit your own". */
    lockedReason?: string
}

const HINT = "text-xs text-gray-500 dark:text-neutral-400"
const BOX = "min-h-[44px] w-full flex-row items-center gap-2 rounded-lg border px-3 py-2.5"

enableIconClassNames(Check, ChevronDown, Globe, Lock)

/**
 * Picks which regions an account may see. Ported from the web's RegionSelect.tsx, with its three rules, which the
 * server enforces again: you grant only regions you hold (Admin and HR grant every region); a region the account holds
 * that you cannot grant stays ticked and locked; and at least one region.
 */
export default function RegionSelect({ value, onChange, existing = [], disabled = false, lockedReason }: Props) {
    const { regions: mine, role, loading } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const grantable: RegionCode[] = role !== null && canAdministerAllRegions(role) ? [...REGION_CODES] : mine

    function toggle(code: RegionCode) {
        // Rebuilt from REGION_CODES, so the order never depends on tap order.
        onChange(REGION_CODES.filter((region) => (region === code ? !value.includes(region) : value.includes(region))))
    }

    if (lockedReason) {
        return (
            <Field label="Regions">
                <View
                    accessible
                    accessibilityLabel={`Regions: ${value.join(", ") || "None"}. ${lockedReason}`}
                    className={clsx(BOX, "border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800/50")}
                >
                    <Lock size={16} className="text-gray-400 dark:text-neutral-500" />
                    {value.length > 0 ? (
                        value.map((code) => <RegionBadge key={code} code={code} />)
                    ) : (
                        <Text className="text-sm text-gray-500 dark:text-neutral-400">None</Text>
                    )}
                </View>
                <Text className={clsx(HINT, "mt-1.5")}>{lockedReason}</Text>
            </Field>
        )
    }

    const isDisabled = disabled || loading
    const isAll = value.length === REGION_CODES.length && value.length > 1

    return (
        <Field label="Regions" required>
            <Pressable
                onPress={() => setIsOpen(true)}
                disabled={isDisabled}
                accessibilityRole="button"
                accessibilityLabel={`Regions: ${value.length ? value.join(", ") : "Select regions"}`}
                className={clsx(
                    BOX,
                    "bg-white dark:bg-neutral-800",
                    isDisabled
                        ? "border-gray-200 opacity-50 dark:border-neutral-800"
                        : "border-gray-300 dark:border-neutral-700",
                )}
            >
                <Globe size={16} className="text-gray-400 dark:text-neutral-500" />
                <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-1.5">
                    {value.length === 0 ? (
                        <Text className="text-sm text-gray-400 dark:text-neutral-500">Select regions</Text>
                    ) : isAll ? (
                        <Text className="text-sm text-gray-800 dark:text-gray-200">All regions</Text>
                    ) : (
                        value.map((code) => <RegionBadge key={code} code={code} />)
                    )}
                </View>
                <ChevronDown size={16} className="text-gray-400 dark:text-neutral-500" />
            </Pressable>
            <Text className={clsx(HINT, "mt-1.5")}>
                {value.length === 0
                    ? "Pick at least one. An account with no region sees an empty app."
                    : "This account can only see records from the regions above."}
            </Text>
            {!loading && grantable.length === 1 && (
                <Text className={clsx(HINT, "mt-1")}>
                    You cover {REGIONS[grantable[0]].label} only, so that is the one region you can grant.
                </Text>
            )}

            <Sheet visible={isOpen} onClose={() => setIsOpen(false)} accessibilityLabel="Regions">
                <View className="gap-1 px-3 pb-3 pt-3">
                    <Text className="px-2 pb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        Regions
                    </Text>
                    {REGION_CODES.map((code) => {
                        const canGrant = grantable.includes(code)
                        const isLockedOn = !canGrant && existing.includes(code)
                        const isChecked = value.includes(code)
                        const isRowDisabled = !canGrant
                        return (
                            <Pressable
                                key={code}
                                onPress={() => toggle(code)}
                                disabled={isRowDisabled}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: isChecked, disabled: isRowDisabled }}
                                accessibilityHint={
                                    isLockedOn
                                        ? "This account already has this region. You cannot change it, because you cannot grant it."
                                        : isRowDisabled
                                        ? "You cannot grant a region you do not have."
                                        : undefined
                                }
                                className={clsx(
                                    "min-h-[48px] flex-row items-center gap-3 rounded-lg px-3",
                                    isRowDisabled && "opacity-50",
                                    isChecked && !isLockedOn && "bg-blue-50 dark:bg-blue-500/10",
                                )}
                            >
                                <View
                                    className={clsx(
                                        "h-5 w-5 items-center justify-center rounded border",
                                        isChecked
                                            ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
                                            : "border-gray-300 dark:border-neutral-600",
                                    )}
                                >
                                    {isChecked && <Check size={12} strokeWidth={3} className="text-white" />}
                                </View>
                                <RegionBadge code={code} />
                                <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                    {REGIONS[code].label}
                                </Text>
                                {isLockedOn && <Lock size={14} className="text-gray-400 dark:text-neutral-500" />}
                            </Pressable>
                        )
                    })}
                    <Button label="Done" onPress={() => setIsOpen(false)} className="mt-2" />
                </View>
            </Sheet>
        </Field>
    )
}
