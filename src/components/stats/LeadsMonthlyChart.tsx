import { useMemo, useState } from "react"
import { Text, View, type LayoutChangeEvent } from "react-native"
import { LineChart } from "react-native-gifted-charts"

import { getConvertedLine, MONTH_NAMES } from "@/lib/statsChart"
import type { MonthBucket } from "@/types/overallStats"

const CHART_HEIGHT = 120
const EDGE_SPACING = 8
const TOTAL_COLOR = "#3b82f6"
const CONVERTED_COLOR = "#10b981"
const AXIS_LABEL_COLOR = "#94a3b8"
// Chart.js's area fill ran from rgba(59,130,246,0.22) at the top to transparent at the bottom.
const FILL_TOP_OPACITY = 0.22
const CONVERTED_DASH = [4, 3]
const READOUT_WIDTH = 120
const READOUT_HEIGHT = 56
const AXIS_LABEL_STYLE = { fontSize: 9, color: AXIS_LABEL_COLOR } as const
// Some headroom above the highest month, as Chart.js leaves.
const HEADROOM = 1.15

/** The tap readout above the chart: the month, its two counts and the converted share. */
function MonthReadout({ month }: { month: MonthBucket | undefined }) {
    if (!month) return null
    return (
        <View className="rounded-md bg-neutral-900 px-2.5 py-1.5 dark:bg-neutral-700">
            <Text className="text-xs font-semibold text-white">{MONTH_NAMES[month.month - 1]}</Text>
            <Text className="text-[10px] text-neutral-200">{`${month.leads} leads · ${month.converted} converted`}</Text>
            <Text className="text-[10px] text-neutral-200">{getConvertedLine(month)}</Text>
        </View>
    )
}

function renderReadout(month: MonthBucket | undefined) {
    return <MonthReadout month={month} />
}

/**
 * The year's 12 months as a light area line: total leads filled in blue, converted as a thin dashed green line, single
 * letter months and no y-axis. A tap shows that month's readout. The native form of the web's LeadsMonthlyChart; the
 * width is measured so the 12 points always fit with no scroll.
 */
export default function LeadsMonthlyChart({ months }: { months: MonthBucket[] }) {
    const [width, setWidth] = useState(0)

    const totals = useMemo(() => months.map((m) => ({ value: m.leads, label: MONTH_NAMES[m.month - 1][0] })), [months])
    const converted = useMemo(() => months.map((m) => ({ value: m.converted })), [months])
    const maxValue = Math.max(1, ...months.map((m) => m.leads)) * HEADROOM
    const spacing = width > 0 ? (width - EDGE_SPACING * 2) / Math.max(1, months.length - 1) : 0

    // The tap readout. gifted-charts calls the label function with the touched month's index.
    const pointerConfig = useMemo(
        () => ({
            pointerColor: TOTAL_COLOR,
            pointer2Color: CONVERTED_COLOR,
            radius: 4,
            pointerStripColor: AXIS_LABEL_COLOR,
            pointerLabelWidth: READOUT_WIDTH,
            pointerLabelHeight: READOUT_HEIGHT,
            autoAdjustPointerLabelPosition: true,
            persistPointer: true,
            pointerLabelComponent: (_items: unknown, _secondary: unknown, index: number) =>
                renderReadout(months[index]),
        }),
        [months],
    )

    function handleLayout(event: LayoutChangeEvent) {
        setWidth(Math.floor(event.nativeEvent.layout.width))
    }

    return (
        <View
            onLayout={handleLayout}
            accessibilityLabel="Leads per month, total and converted"
            className="h-40 justify-end"
        >
            {width > 0 && (
                <LineChart
                    data={totals}
                    data2={converted}
                    width={width}
                    height={CHART_HEIGHT}
                    maxValue={maxValue}
                    spacing={spacing}
                    initialSpacing={EDGE_SPACING}
                    endSpacing={EDGE_SPACING}
                    disableScroll
                    curved
                    hideDataPoints
                    hideRules
                    hideYAxisText
                    yAxisLabelWidth={0}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    xAxisLabelTextStyle={AXIS_LABEL_STYLE}
                    color1={TOTAL_COLOR}
                    thickness1={2}
                    areaChart1
                    startFillColor1={TOTAL_COLOR}
                    endFillColor1={TOTAL_COLOR}
                    startOpacity1={FILL_TOP_OPACITY}
                    endOpacity1={0}
                    color2={CONVERTED_COLOR}
                    thickness2={1.5}
                    strokeDashArray2={CONVERTED_DASH}
                    pointerConfig={pointerConfig}
                />
            )}
        </View>
    )
}
