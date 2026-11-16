import { Text, View } from "react-native"

import { Field, SelectSheet, type SelectOption } from "@/components/ui"
import type { WriteRegion } from "@/hooks/useWriteRegion"
import { REGIONS, type RegionCode } from "@/lib/region"

interface Props {
    region: WriteRegion
}

const FIXED_CLASSES =
    "min-h-[44px] w-full flex-row items-center rounded-lg border border-slate-300 bg-gray-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/60"

/**
 * The region field on a create form: a choice when viewing all regions, a fixed value otherwise. Ported from the web's
 * WriteRegionField.tsx, showing the full region name where the web shows a flag and the code.
 */
export default function WriteRegionField({ region }: Props) {
    const { value, setValue, options, pinned } = region

    if (options.length > 1) {
        const choices: SelectOption<RegionCode>[] = options.map((code) => ({ label: REGIONS[code].label, value: code }))
        return (
            <SelectSheet label="Region" required title="Region" options={choices} value={value} onChange={setValue} />
        )
    }

    return (
        <Field label="Region" required>
            <View
                accessible
                accessibilityLabel={
                    value
                        ? `Region: ${REGIONS[value].label}` +
                          (pinned ? ". To save in another region, switch region in More." : "")
                        : "Region"
                }
                className={FIXED_CLASSES}
            >
                <Text className="text-sm text-neutral-800 dark:text-neutral-100">
                    {value ? REGIONS[value].label : "..."}
                </Text>
            </View>
            {pinned && (
                <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    To save in another region, switch region in More.
                </Text>
            )}
        </Field>
    )
}
