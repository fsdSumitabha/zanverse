# Session 20 — Overall stats and charts

A "Pipeline overview" screen with real native charts: a KPI row, four status pies, budget and team cards, and the leads-over-time drill-down.

---

Session 20 — Overall stats and charts.

Read docs/OVERVIEW.md §3 (Styling, Data, Charts, Navigation), §4 (packages — `react-native-gifted-charts` +
`react-native-linear-gradient` `^1.4`, on `react-native-svg@^15.15`), §5 (structure), §8 (shared code rule), §11 risk 2.
Read docs/SCREENS.md `/admin/operations/overall-stats` (all of it, especially "On a phone").
Read docs/API_CONTRACT.md the `GET /api/admin/operations/overall-stats` row and its "silent failure for the ambient
panels" note.
Read docs/CLIENT_SYSTEMS.md the `chart.js + react-chartjs-2` row.

Reference (read-only): reference/zan-workspace —
`src/components/admin/operations/OverallStatsPanel.tsx` (558 lines: the fetch, the four `*_STATUS_META` colour maps,
`INR_COMPACT`, `KpiCard`, `EntityPieCard`, `CardHeader`),
`src/components/admin/operations/Leadsovertimecard .tsx` (year accordion, `fillMonths`, the month table),
`src/components/admin/operations/statistics/LeadsMonthlyChart .tsx` (the 12-month area line),
`src/app/admin/operations/overall-stats/page.tsx` (the title "Pipeline overview" and its subtitle),
`src/app/api/admin/operations/overall-stats/route.ts` and `src/lib/stats/computeOverallStats.ts` (the exact payload keys).

## Goal
`OverallStatsScreen`, reachable from the "More" tab, loads `GET /api/admin/operations/overall-stats` once and renders:
conversion / active budget / upcoming / active team KPIs, then one column of cards — Leads (donut with the conversion
percentage in the centre), Clients, Projects and Meetings pies, each with its counts-and-percent legend — then budget,
role counts and the leads-over-time accordion with a native month chart. Any signed-in role can open it.

## Scope
- Install `react-native-gifted-charts@^1.4` and `react-native-linear-gradient`, rebuild Android, and spike one
  `PieChart` with `donut` + `innerRadius` on a throwaway screen before porting anything.
- `src/types/overallStats.ts` — the `OverallStats` interface copied from `OverallStatsPanel.tsx`, corrected to
  `leads.conversionRate: number | null` (the API returns `null` when nothing is converted or lost yet).
- `src/constants/statsPalette.ts` — `LEAD_STATUS_META`, `CLIENT_STATUS_META`, `PROJECT_STATUS_META`,
  `MEETING_STATUS_META` copied verbatim with their hex colours and labels, keyed by the payload's string keys
  (`new`…`lost`; `active|inactive|onHold|completed`; `discussion|proposalSent|…|closed`; `scheduled|…|completed`).
- `src/lib/statsChart.ts` — one `toPieData({ byStatus, meta })` helper returning `[{ value, color, text, label }]` for
  the entries with `value > 0`, plus `formatInrCompact(n)` ported from `INR_COMPACT` (Cr / L / k thresholds unchanged,
  written by hand — no `Intl.NumberFormat`).
- `src/screens/stats/OverallStatsScreen.tsx` — header "Pipeline overview" plus the web subtitle, one `send` call through
  `src/api/client.ts`, a `ScrollView` with pull-to-refresh, skeleton cards while loading, and the `TimeAgo` "Updated"
  stamp right-aligned above the KPIs. Keep it under 250 lines by composing the cards below.
- `src/components/stats/KpiRow.tsx` — a 2x2 grid of the four web KPIs with the same lucide icons (`TrendingUp`,
  `Wallet`, `CalendarClock`, `Users`), tones and subtitles. Show `—` for conversion when `conversionRate` is null,
  instead of the web's `NaN%`.
- `src/components/stats/StatusPieCard.tsx` — one component, four usages. Props `{ label, total, accent?, accentTone?,
  byStatus, meta, variant: "pie" | "donut", centerLine1?, centerLine2?, onPressTitle? }`. Gifted-charts `PieChart`,
  with `donut` + `innerRadius={radius * 0.65}` on the Leads card (the web's `cutout: "65%"`), `focusOnPress` and a
  `centerLabelComponent` showing the selected slice's label, value and percent, falling back to `centerLine1` /
  `centerLine2`. The legend rows port as-is: colour swatch, label, count, percent. "No activity yet" when every value
  is 0. The title taps through to Leads / Clients / Projects / Meetings, replacing the web `Link`.
- `src/components/stats/BudgetCard.tsx` — `formatInrCompact(projects.totalBudgetRunning)` as the headline with
  `projects.pipeline` / `running` / `closed` beneath it.
- `src/components/stats/RoleCountsCard.tsx` — `users.byRole` (keyed by role number) sorted descending, each row showing
  `USER_ROLE_META[role].label` from the copied constants with `Role ${role}` as the fallback, plus active / inactive.
- `src/components/stats/LeadsOverTimeCard.tsx` — the year accordion: years sorted newest first, the latest expanded by
  default, `ChevronRight` rotated when open, the `leads` / `converted` / percent summary row, and `fillMonths` ported
  unchanged. Inside an open year: the mobile three-column month table (Month / Total / Converted, `—` for empty months)
  then `LeadsMonthlyChart`.
- `src/components/stats/LeadsMonthlyChart.tsx` — a gifted-charts `LineChart` over the dense 12 slots: total leads as the
  `#3b82f6` area line using `areaChart` + `startFillColor`/`endFillColor` (`rgba(59,130,246,0.22)` → transparent) in
  place of the Chart.js `ScriptableContext` gradient, converted as a thin dashed `#10b981` line, single-letter month
  labels, no y-axis chrome, and `hideDataPoints` with `focusEnabled` + `pointerConfig` for the tap readout
  ("<N>% converted", "No leads" when that month is empty).
- `src/navigation/` — register `OverallStats` on the app stack and point the "More" entry at it.

## Already decided (follow these)
- Charts are `react-native-gifted-charts` on `react-native-svg@^15.15`, which sessions 1–3 already validated; charts
  exist only on this screen.
- Plain `fetch` + `useState`/`useEffect` through `src/api/client.ts` with the `Authorization: Bearer` token and
  `X-Active-Region`. No TanStack Query, no Chart.js, no recharts, no Skia.
- The payload is server-computed and cached; the screen fetches on mount and on pull-to-refresh only.
- NativeWind `className` with the web's Tailwind strings; cards, pills and skeletons come from `src/components/ui/`.
- `TimeAgo` and every date use `dayjs`.
- `src/constants/` and `src/types/` mirror the web app (§8) — copy the files, do not retype the colours.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components and
  screens, every file under 250 lines, every string inside a `<Text>`.

## Steps
1. `npm i react-native-gifted-charts react-native-linear-gradient`, rebuild Android, and render one hard-coded donut.
   If it fails to build on 0.87, stop and take the fallback in the follow-up section before writing any card.
2. Copy the types and the four colour metas, add the endpoint to `src/api/endpoints.ts`, and curl the dev API to confirm
   the payload keys and that `conversionRate` can be `null`.
3. Build `OverallStatsScreen` with its loading, error, empty and content states and `KpiRow` only.
4. Build `StatusPieCard` and wire all four usages, donut variant on Leads with the real conversion percentage in the
   centre (the web hard-codes the string "89% converted" as the Leads accent — use the computed value instead).
5. Add `BudgetCard` and `RoleCountsCard`.
6. Port `LeadsOverTimeCard` with `fillMonths` and the month table, then add `LeadsMonthlyChart` inside the open year.
7. Register the route in the "More" menu and check the screen on a 360dp device in light and dark.

## Definition of done
- [ ] `npm run android` builds and installs with gifted-charts and linear-gradient linked.
- [ ] The "More" menu opens "Pipeline overview" and it renders real dev-API data for a non-admin signed-in user.
- [ ] The four KPIs match the web screen side by side, and a database with no converted or lost lead shows `—` rather
      than `NaN%`.
- [ ] Each of the four cards draws a chart whose slice colours match its legend swatches, and a card whose counts are
      all zero shows "No activity yet".
- [ ] Tapping a slice on the Leads donut shows that status in the centre; tapping again restores the conversion
      percentage.
- [ ] The budget headline uses the Cr / L / k format and matches the web for the same data.
- [ ] The leads-over-time card opens the latest year by default, collapses and expands on tap, shows 12 month rows with
      `—` for empty months, and the month chart's tap readout names the right month.
- [ ] Nothing scrolls horizontally at 360dp and every legend row is readable in light and dark.
- [ ] Each new file is under 250 lines, and `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

If `react-native-gifted-charts` or `react-native-linear-gradient` fails to build on RN 0.87, take the documented stopgap:
keep every non-chart card native and render only the charts in a `react-native-webview` holding the existing Chart.js
config, one WebView per card at a fixed height with scrolling disabled. Record it in docs/OVERVIEW.md §10 as a stopgap
with the build error, and keep the component boundaries so native charts drop in later. If the charts build but
`LeadsMonthlyChart` is unfinished, ship the month table alone and report the chart as deferred.
