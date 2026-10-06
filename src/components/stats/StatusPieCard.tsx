import { useCallback, useMemo } from "react"
import { Text, View, useColorScheme } from "react-native"
import { PieChart } from "react-native-gifted-charts"

import type { StatusMeta } from "@/constants/statsPalette"
import { getPercent, toPieData, type PieSlice } from "@/lib/statsChart"
import { PALETTE } from "@/theme"

import StatsCardHeader from "./StatsCardHeader"
import { STATS_CARD_CLASSES, type Tone } from "./statsTones"

interface Props {
    label: string
    total: number
    accent?: string
    accentTone?: Tone
    byStatus: Record<string, number>
    meta: Record<string, StatusMeta>
    variant: "pie" | "donut"
    centerLine1?: string
    centerLine2?: string
    onPressTitle?: () => void
}

const RADIUS = 64
// The web's `cutout: "65%"`.
const DONUT_INNER_RADIUS = RADIUS * 0.65
// The hole's width, less a little room, so the centre text never touches a slice.
const CENTER_STYLE = { width: DONUT_INNER_RADIUS * 2 - 8 } as const

function getSwatchStyle(color: string) {
    return { backgroundColor: color }
}

/** The donut's centre: the tapped slice's value, label and share, else the card's own two lines. */
function PieCenter({
    slice,
    total,
    line1,
    line2,
}: {
    slice?: PieSlice
    total: number
    line1?: string
    line2?: string
}) {
    const top = slice ? String(slice.value) : line1
    const bottom = slice ? `${slice.label} · ${getPercent(slice.value, total)}%` : line2

    return (
        <View style={CENTER_STYLE} className="items-center justify-center">
            {!!top && <Text className="text-xl font-bold leading-none text-neutral-900 dark:text-white">{top}</Text>}
            {!!bottom && (
                <Text numberOfLines={2} className="mt-1 text-center text-[10px] text-neutral-500 dark:text-neutral-400">
                    {bottom}
                </Text>
            )}
        </View>
    )
}

/**
 * One status breakdown: the title and total, a pie or a donut, and a legend of count and share per status. A tap on a
 * slice lifts it; on the donut the centre then names it, and a second tap restores the card's own lines. Ported from
 * the web's EntityPieCard; the legend sits under the chart so every row has the full width of a phone.
 */
export default function StatusPieCard({
    label,
    total,
    accent,
    accentTone,
    byStatus,
    meta,
    variant,
    centerLine1,
    centerLine2,
    onPressTitle,
}: Props) {
    const isDarkMode = useColorScheme() === "dark"
    const slices = useMemo(() => toPieData({ byStatus, meta }), [byStatus, meta])
    const isDonut = variant === "donut"

    // gifted-charts calls this with the tapped slice's index, or -1 when none is lifted.
    const renderCenter = useCallback(
        (selectedIndex: number) => (
            <PieCenter slice={slices[selectedIndex]} total={total} line1={centerLine1} line2={centerLine2} />
        ),
        [slices, total, centerLine1, centerLine2],
    )

    return (
        <View className={STATS_CARD_CLASSES}>
            <StatsCardHeader
                label={label}
                total={total}
                accent={accent}
                accentTone={accentTone}
                onPressTitle={onPressTitle}
            />

            {slices.length === 0 ? (
                <View className="mt-6 h-40 items-center justify-center">
                    <Text className="text-sm text-neutral-500">No activity yet</Text>
                </View>
            ) : (
                <View className="mt-4 gap-4">
                    <View className="items-center" accessibilityLabel={`${label} chart`}>
                        <PieChart
                            data={slices}
                            radius={RADIUS}
                            donut={isDonut}
                            innerRadius={isDonut ? DONUT_INNER_RADIUS : undefined}
                            innerCircleColor={isDarkMode ? PALETTE["neutral-900"] : PALETTE.white}
                            focusOnPress
                            centerLabelComponent={isDonut ? renderCenter : undefined}
                        />
                    </View>
                    <View className="gap-1.5">
                        {slices.map((slice) => (
                            <View key={slice.key} className="min-h-[24px] flex-row items-center gap-2">
                                <View style={getSwatchStyle(slice.color)} className="h-2.5 w-2.5 rounded-sm" />
                                <Text
                                    numberOfLines={1}
                                    className="flex-1 text-xs text-neutral-700 dark:text-neutral-300"
                                >
                                    {slice.label}
                                </Text>
                                <Text className="text-xs font-semibold text-neutral-900 dark:text-white">
                                    {slice.value}
                                </Text>
                                <Text className="w-9 text-right text-[10px] text-neutral-500 dark:text-neutral-400">
                                    {`${getPercent(slice.value, total)}%`}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    )
}
