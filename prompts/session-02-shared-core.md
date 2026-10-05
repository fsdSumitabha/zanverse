# Session 02 — Foundation A: shared core copied from the web

At the end of this session `src/constants`, `src/types` and the pure helpers in `src/lib` exist in the app, byte-identical to the web where they can be, and a Jest suite proves the tricky parts still behave.

---

Session 02 — Foundation A: shared core copied from the web.

Read docs/OVERVIEW.md §3 (Data, Forms, Region), §4 (packages), §5 (project structure) and §8 (the shared code rule), plus docs/SHARED_CODE.md in full — its per-file table says which of the 31 files copy clean and which need one line changed.
Reference (read-only): D:\zan-workspace — `src/constants/` (18 files), `src/types/` (12 files + `types/facebook/facebook-leads.ts`), `src/lib/phone.ts`, `src/lib/region.ts`, `src/lib/lead-sources/day.ts`, `src/components/admin/operations/lead-sources/callback.ts`, `src/components/admin/operations/lead-sources/useNow.ts`, `src/components/admin/operations/dayjs/TimeAgo.tsx`.

## Goal

The numeric code system, the wire types and the pure date/phone/region helpers live in `D:\zanverse\src`, with the web's labels, colours and comments intact. Nothing renders yet — this is the layer every later session imports. A Jest suite covers the behaviour that is easy to break in a copy: phone parsing, day strings, region fallback and the retired status code 60.

## Scope

- `src/constants/` — all 18 files from the web, same names, same contents: `_invert.ts`, `callStatus.ts`, `clientStatus.ts`, `entityTypes.ts`, `eventTypes.ts`, `interactionTypes.ts`, `labels.ts` (it is a 0-byte placeholder; keep it empty), `leadSourceRoles.ts`, `leadSourceStatus.ts`, `leadStatus.ts`, `meetingStatus.ts`, `meetingTypes.ts`, `notificationChannels.ts`, `notificationRules.ts`, `projectStatus.ts`, `services.ts`, `statusMetaByEntity.ts`, `userRoles.ts`.
- Two of those need exactly one edit each: in `callStatus.ts` make line 1 `import type * as Icons from "lucide-react-native"` so `icon: keyof typeof Icons` keeps its "PhoneOutgoing"/"PhoneIncoming" typing with no runtime import; in `notificationChannels.ts` keep the `{ 2: Email, 3: SMS, 4: Web Push }` codes and labels as a data-only map, leaving the `dispatchEmail`/`dispatchSms`/`dispatchPush` imports behind on the server.
- `src/types/` — `authProfile.ts`, `clients.ts`, `contact.ts`, `interaction.ts`, `lead.ts`, `leadSource.ts`, `meeting.ts`, `notification.ts`, `projects.ts`, `quotation.ts`, `user.ts`, `facebook/facebook-leads.ts`. `notification.ts` and `quotation.ts` carry mongoose `Types.ObjectId` fields — declare those ids as `string` so the files compile without mongoose. `contact.ts` and `interaction.ts` reach into `@/config/*` string unions: copy them with a header comment marking them legacy and unused by RN (SHARED_CODE.md §Notes explains the `types/interaction.ts` trap; session 8 writes the real timeline row type).
- `src/lib/phone.ts` — verbatim. The `HIDDEN_MARKS` regex contains literal zero-width and bidi characters; they must survive the copy.
- `src/lib/region.ts` — verbatim apart from `getRegion()`, which reads `process.env.NEXT_PUBLIC_REGION`. Keep `REGION_CODES`, `RegionCode`, `RegionConfig`, `REGIONS`, `DEFAULT_REGION`, `parseRegionCode`, `ALL_REGIONS`, `ActiveRegion`, `ALL_REGIONS_META` and `resolveEffectiveRegion`, and leave a comment that session 4 supplies the active region from the authenticated user's `regions[]`.
- `src/lib/leadSourceDay.ts` — the web's `lib/lead-sources/day.ts` verbatim: `toDayString`, `todayString`, `isDayString`, `dayToLocalDate`, `addDays`, `daysBetween`, `formatDay`, `utcTodayString`, `resolveClientToday`.
- `src/lib/callback.ts` — the web's lead-sources `callback.ts`, with its import repointed to `@/lib/leadSourceDay`: `CallbackPreset`, `CALLBACK_PRESETS`, `callbackPayload`, `CallbackState`, `callbackState`, `formatCallback`, `relativeCallback`, `toDateTimeLocal`.
- `src/hooks/useNow.ts` — the web's `useNow(intervalMs = 20_000)`, without the `"use client"` line.
- `src/lib/format.ts` — a small dayjs module replacing the web's `toLocaleString()` / `{ dateStyle: "medium", timeStyle: "short" }` calls and `TimeAgo.tsx`. Extend the `relativeTime` plugin once here and export: `formatDateTime` ("MMM D, YYYY h:mm A"), `formatDate` ("MMM D, YYYY"), `formatShortDate` ("MMM D", as `filters/DateField.tsx` shows it), `formatTime` ("h:mm A"), `formatDayTime` ("ddd, h:mm A"), `formatFullDateTime` ("DD/MM/YYYY hh:mm A", `TimeAgo`'s tooltip), `formatTimeAgo` (`fromNow()`) and `formatAmount` (`Intl.NumberFormat("en-IN")`, for budgets and quotation amounts).
- Jest tests under `src/lib/__tests__/` and `src/constants/__tests__/`, covering the five cases below plus the rest of each helper's surface.

## Already decided (follow these)

- `src/constants` and `src/types` are copies, not rewrites (OVERVIEW §8). Keep the web's labels verbatim — "New Lead", "Meeting Scheduled", "Business Development Executive" — so the two clients read the same.
- Tailwind class strings inside the `*_META` maps stay exactly as they are: NativeWind consumes them in session 3.
- Codes never change: `LEAD_SOURCE_STATUS` is 10/20/30/40/50/70 with 60 retired, `MEETING_STATUS` shares 2010–2050 with the meeting `INTERACTION_TYPE` codes on purpose, `CLIENT_STATUS` is the 1–4 exception.
- Packages (OVERVIEW §4): `libphonenumber-js@^1.13`, `dayjs@^1.11`, `clsx@^2`, `lucide-react-native@^1.49`. Install any that session 1 left out; add nothing else.
- Style (CODING_STYLE.md): 4 spaces, no semicolons, double quotes, `function` declarations, named exports, `@/` for cross-folder imports and `./` inside a folder.
- No UI, no `fetch`, no native modules in this session.

## Steps

1. Confirm the `@/` alias resolves in all three toolchains: `paths: { "@/*": ["./src/*"] }` in `tsconfig.json`, `babel-plugin-module-resolver` in `babel.config.js`, and `moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" }` in `jest.config.js`. Add whichever is missing and prove it with a one-line throwaway import.
2. Copy the 18 constants files, then make the two edits named above. Run `npx tsc --noEmit` and fix only import paths.
3. Copy the types files with the `string`-id and legacy-header adjustments, then `npx tsc --noEmit` again.
4. Copy `phone.ts` and `region.ts`. Open `phone.ts` in a hex-aware view or print `HIDDEN_MARKS.source.length` to confirm the invisible characters came across.
5. Add `leadSourceDay.ts`, `callback.ts` and `hooks/useNow.ts`, repointing the day import.
6. Write `format.ts` against the web call sites listed above (`MeetingCard.tsx`, `CallItem.tsx`, `QuotationItem.tsx`, `activityLog/formatActivityValue.ts`, `profile/page.tsx`, `filters/DateField.tsx`, `dayjs/TimeAgo.tsx`) so each has a named replacement.
7. Write the tests. The five that matter most: phone parsing (an extension returns `HAS_EXTENSION`; "Call after 6pm: 415 555 0146" and two numbers in one cell return `NOT_A_NUMBER`; a number wrapped in `\u200B` still parses; "9876543210" reads as `+919876543210` with `IN` and as a US number with `US`); `isDayString("2026-02-30") === false` with `"2026-02-28" === true`; `toDayString` across a midnight boundary (23:59 and 00:01 local give different days); `resolveEffectiveRegion(ALL_REGIONS).label === "India"`; `LEAD_SOURCE_STATUS_META[60] === undefined`, so a renderer must fall back to Unknown/grey.
8. Cover the rest: `validateLocalPhone` returning `HAS_COUNTRY_CODE` and `OTHER_COUNTRY`, `checkPastedPhone`'s allow/replace/reject branches, `phoneLookupCondition` matching "4155550181", "(415) 555-0181" and "001 415 555 0181", `addDays`/`daysBetween`/`formatDay` Today/Tomorrow/Yesterday, `resolveClientToday` clamping a forged day to the UTC day, `parseRegionCode("us") === "US"` and `parseRegionCode("XX") === "IN"`, `callbackState` at the 15-minute boundary, `relativeCallback` giving "in 25 min" / "5 min ago" / "due now", `EVENT_CODE`/`EVENT_TYPE` round-tripping, and `LEAD_SOURCE_OPEN_STATUSES` / `LEAD_SOURCE_CLOSED_STATUSES` staying derived from `closed`.
9. Run `npm test`, `npx tsc --noEmit` and `npm run lint`, then `npm run android` to confirm the app still builds with the new files on disk.

## Definition of done

- [ ] `src/constants/` holds 18 files and `src/types/` holds 12 files plus `facebook/facebook-leads.ts`.
- [ ] `grep -r "lucide-react\"" src/constants src/types` finds nothing, and no file under `src/constants` or `src/types` imports mongoose or `@/lib`.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes, with tests for `phone.ts`, `region.ts`, `leadSourceDay.ts`, `callback.ts`, `format.ts` and the constants invariants.
- [ ] The five named cases each have an asserting test: extension/stray-text/zero-width/country-default phone parsing, `isDayString("2026-02-30") === false`, `toDayString` across midnight, `resolveEffectiveRegion(ALL_REGIONS)` giving India, `LEAD_SOURCE_STATUS_META[60] === undefined`.
- [ ] `npm run android` builds and the app starts on the emulator.
- [ ] `LEAD_STATUS_META[10].label === "New Lead"` and `USER_ROLE_META[65].label === "US Sales Agent"` — the labels match the web exactly.

## When you are done

Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

If Jest fails on `libphonenumber-js` or `libphonenumber-js/mobile/examples` with an unexpected-token or ESM error, add `libphonenumber-js` to `transformIgnorePatterns` in `jest.config.js` (keep `node_modules/(?!(...|libphonenumber-js)/)` around the preset's existing entries) and rerun `npm test`. If `@/` fails only inside Jest, the `moduleNameMapper` entry from step 1 is missing. Then finish the remaining tests and run the Definition of done checks.
