import { useEffect } from "react"
import { Text, View } from "react-native"

import { SelectSheet, type SelectOption } from "@/components/ui"
import { roleLabel, useAssignees } from "@/hooks/useAssignees"

interface Props {
    label?: string
    regions: string[]
    value: string
    onChange: (userId: string) => void
    noneLabel?: string
}

/**
 * A sheet of people. Only people who hold every region in `regions` are listed, the same rule the server applies.
 * Ported from the web's AssigneeSelect.tsx. "" is nobody.
 */
export default function AssigneeSelect({ label, regions, value, onChange, noneLabel = "Nobody for now" }: Props) {
    const { people, loading, error } = useAssignees(regions)

    // Drop a choice that is no longer on the list, for example after the region changed.
    useEffect(() => {
        if (!loading && value && !people.some((person) => person._id === value)) onChange("")
    }, [loading, people, value, onChange])

    const options: SelectOption<string>[] = [
        { label: loading ? "Loading people..." : noneLabel, value: "" },
        ...people.map((person) => ({ label: `${person.name} (${roleLabel(person.role)})`, value: person._id })),
    ]

    return (
        <View className="gap-1">
            <SelectSheet
                label={label}
                options={options}
                value={value}
                onChange={onChange}
                disabled={loading}
                title={label ?? "Assign to"}
            />
            {!!error && <Text className="text-xs text-rose-600">{error}</Text>}
            {!loading && !error && people.length === 0 && (
                <Text className="text-xs text-neutral-500">
                    Nobody with a lead source role covers {regions.join(" and ") || "this region"}.
                </Text>
            )}
        </View>
    )
}
