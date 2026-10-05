# Session 13 — Lead sources C: sheet uploads and reports

A manager picks an .xlsx on the phone, watches it upload, reads the per-row report, and saves the template or the skipped rows as a real file.

---

Session 13 — Lead sources C: sheet uploads and reports.

Read docs/OVERVIEW.md §3 (Files, Data, Region, Storage), §4 (packages), §5 (structure), §8 (shared code rule).
Read docs/LEAD_SOURCES.md — the three screens `/lead-sources/upload`, `/lead-sources/uploads` and
`/lead-sources/uploads/[uploadId]` with their "On a phone" notes, the flow "Sheet upload -> parse -> rows", "Reports and
counting", "Roles and access", and the `UploadForm.tsx` / `ReportGrid.tsx` rows under "Components".
Read docs/API_CONTRACT.md on the response envelope, `send()` / `ApiError { message, status, field, details }`, and the
"BINARY DOWNLOADS" note — the two .xlsx routes cannot be opened with `Linking.openURL`. Read docs/BACKEND_CHANGES.md
item 5 (both .xlsx routes authenticate through `getUserFromRequest`, so they inherit the Bearer fallback).

Reference (read-only): D:\zan-workspace —
`src/components/admin/operations/lead-sources/UploadForm.tsx` (the three-step form, 257 lines), `ReportGrid.tsx`,
`DayChoice.tsx`, `AssigneeSelect.tsx`, `api.ts`, `src/app/admin/operations/lead-sources/upload/page.tsx`,
`uploads/UploadsClient.tsx`, `uploads/[uploadId]/page.tsx`, `src/app/api/admin/operations/lead-sources/uploads/route.ts`,
`uploads/[id]/route.ts`, `uploads/[id]/download/route.ts`, `template/route.ts`, `src/lib/lead-sources/upload.ts` (the
exact refusal messages), `src/config/leadSourceSheet.ts`, `src/constants/leadSourceStatus.ts` (`UPLOAD_STATUS`,
`UPLOAD_ROW_RESULT`, `UPLOAD_ROW_RESULT_META`), `src/constants/leadSourceRoles.ts`, `src/types/leadSource.ts`.

## Goal
A manager on a phone uploads a cold-calling sheet end to end: pick an .xlsx or .csv with the Android document picker,
see its name and size, watch a real progress bar, land on the report. The uploads history lists every sheet in their
regions, and the report shows the four count tiles, the file notes, every sheet row as a card with its result and
reasons, and two working .xlsx downloads opened by the system viewer. Manager-only throughout.

## Scope
- `src/screens/leadSources/LeadSourceUploadScreen.tsx` — the ported `UploadForm`, two cards instead of a dropzone page:
  "1. The sheet" (Download template button, the file row, the expected header chips) and "2. Who calls them, and when"
  (`useWriteRegion` field from session 7, `AssigneeSelect` + `useAssignees([region])` from session 11, `DayChoice` with
  `noneLabel="No day yet"`), then the error block and Cancel / "Upload and check".
- `src/components/leadSources/FilePickRow.tsx` — one "Choose a file" `Button` replacing the dropzone. Picked state is a
  chip: `FileSpreadsheet` icon, the file name on one line (`numberOfLines={1}`), `sizeText(bytes)` ported verbatim
  (`KB` under 1 MB, one decimal `MB` above), and an X that clears the file and the error.
- `src/lib/leadSourceUpload.ts` — `pickSheetFile()` over `@react-native-documents/picker@^12`: single file, the three
  MIME types the web accepts (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`,
  `application/vnd.ms-excel` — Android labels CSV that way), then a local copy in the cache directory so the
  `content://` URI cannot expire before the upload finishes (`keepLocalCopy({ destination: "cachesDirectory" })` or
  `pick({ copyTo: "cachedDirectory" })` — check the installed typings; a stable local path is the requirement). Guards
  in the same file keep the server's wording: over `maxFileMb` → `The file is larger than 5 MB. Split it into smaller
  files.`; a `.xls` name → `Choose an .xlsx or a .csv file. For an old .xls file, save it as .xlsx first.`; 0 bytes →
  `The file is empty.` Nothing is parsed on the device.
- `uploadSheet({ file, region, assignedTo, allottedDay, onProgress })` in the same file — `react-native-blob-util@^0.25`
  multipart to `POST /api/admin/operations/lead-sources/uploads`: parts `file` (wrapped local path), `today`
  (`todayLocal()` / the copied `toDayString`, never `toISOString`), and `region` / `assignedTo` / `allottedDay` only when
  set. Headers: `Authorization: Bearer <getToken() from src/store/keychain.ts>` and `X-Active-Region`, no
  `Content-Type`. `.uploadProgress({ interval: 250 })` drives the bar. Parse the JSON reply and throw the same
  `ApiError` from `src/api/client.ts` on `!success`, so `error.details.missing` / `error.details.found` keep rendering
  and 401 keeps behaving. Resolve `{ uploadId, counts: { read, imported, warned, skipped } }`.
- While uploading: a progress bar with a percentage, the button reading "Checking and importing...", every field
  disabled, a "Stay on this screen until the upload finishes." line, and a `beforeRemove` listener blocking the Android
  back button until the request settles.
- The expected header row comes from the server, not from a bundled copy of `leadSourceSheet.ts`: fetch
  `GET /api/admin/operations/lead-sources/columns` expecting `{ columns: [{ key, label, headers, required }], rules:
  { maxFileMb, maxRows } }`, render required headers as rose chips and the rest as grey, under "Header row. Names in red
  are required. Case, spaces and underscores do not matter." That route does not exist on the dev API yet — on a 404
  hide the chips, show "Download the template to see the expected header row." instead, and add the request (path,
  shape, `LEAD_SOURCE_MANAGE_ROLES`, read from `LEAD_SOURCE_COLUMNS` + `LEAD_SOURCE_SHEET_RULES`) to
  docs/BACKEND_CHANGES.md under "Required". Only the two numbers (`maxFileMb: 5`, `maxRows: 5000`) are copied locally,
  in `src/constants/leadSourceSheet.ts`, as the guard's fallback.
- On success: toast `${counts.imported} imported${counts.skipped ? ", " + counts.skipped + " skipped" : ""}.` and
  `navigation.replace("LeadSourceReport", { uploadId })`. On failure: the rose problem card — the server message, then
  `Headers found in the file: <found joined>` when `details.found` is present, then "Nothing was saved. Fix the file and
  upload it again." The file stays picked.
- `src/screens/leadSources/LeadSourceUploadsScreen.tsx` — `useListQuery` + `ListScreen` from session 6 against
  `GET /api/admin/operations/lead-sources/uploads?page&limit=20`, newest first, with an "Upload sheet" header button.
  Each row: `FileSpreadsheet`, file name, `RegionBadge`, the rose "Failed" chip at `UPLOAD_STATUS.FAILED`, a second line
  `{uploadedBy?.name || "Someone"} · <TimeAgo createdAt/>` plus ` · for {assignedTo.name}` / ` · {formatDay(allottedDay)}`
  when set, and the three counters (imported emerald, warnings amber when `warned > 0`, skipped rose or grey). Empty
  state "No sheets uploaded yet."
- `src/screens/leadSources/LeadSourceReportScreen.tsx` — `GET /api/admin/operations/lead-sources/uploads/:id` through
  `send`. Header card: file name, `RegionBadge`, `{uploadedBy?.name} · <date>` plus `· sheet "{sheetName}"` when it is
  set and not `"CSV"`, the `For {assignedTo.name}` / "Not assigned" + day line, the four tiles (Rows read, Imported,
  With warnings, Skipped) as a 2x2 grid, the rose `report.error` box at `UPLOAD_STATUS.FAILED`, the `fileNotes` list plus
  `Not in this file, so left empty: {missingColumns.join(", ")}.`, and "Open the N imported sources" navigating to
  `LeadSources` with `{ view: "all", upload: report._id }` when `counts.imported > 0`.
- `src/components/leadSources/ReportRows.tsx` — the phone replacement for `ReportGrid`: filter chips All rows /
  Imported (`result !== SKIPPED`) / With warnings / Skipped with their counts, a search box matching the row number, any
  cell and any message, and a `FlatList` of row cards 50 at a time via `onEndReached`. A card shows `Row {n}`, the result
  chip and tint from `UPLOAD_ROW_RESULT_META`, the `messages` lines, and the first four non-empty cells as
  `{columns[i].header}: {value}`, expanding to every cell on tap; a card with `sourceId` opens `LeadSourceDetail`.
- `src/lib/downloadFile.ts` — `downloadXlsx(path, fileName)`: `ReactNativeBlobUtil.config({ fileCache: true, path:
  dirs.CacheDir + "/" + fileName, appendExt: "xlsx" }).fetch("GET", API_BASE_URL + path, { Authorization, "X-Active-Region" })`,
  then `ReactNativeBlobUtil.android.actionViewIntent(saved, XLSX_MIME)`; non-2xx reads the body and toasts the server
  message. Used by "Download template" (`/template` → `lead-source-template.xlsx`), "Download report"
  (`/uploads/:id/download` → `{fileName without extension}-report.xlsx`) and "Skipped rows only"
  (`?only=skipped` → `-report-skipped.xlsx`, shown only when `counts.skipped > 0`, hint "Fix these rows in Excel, then
  upload the same file again").
- Register `LeadSourceUpload`, `LeadSourceUploads` and `LeadSourceReport` in `CallsStack`, so session 11's "Uploads" row
  and session 12's source-file link both land somewhere real.

## Already decided (follow these)
- Manager-only: `canManageLeadSources(role)` from the copied `leadSourceRoles.ts` (`MANAGE = [10, 15, 45, 69]`) hides
  the entry points, and a 403 renders the session 3 `AccessDenied` with the server's message.
- `react-native-blob-util@^0.25` owns both directions — the multipart upload (for progress) and the two authenticated
  downloads (because a bare link sends no `Authorization` header). `Linking.openURL` is not a download path.
- Everything else goes through `src/api/client.ts` (`send`, `ApiError`, Bearer, `X-Active-Region`, the 401 reset); the
  blob-util calls borrow the same token and region header and throw the same `ApiError`.
- `@react-native-documents/picker@^12`, `react-native-blob-util@^0.25`, `lucide-react-native@^1.49`, `dayjs@^1.11`,
  `clsx@^2`, `react-native-toast-message@^2.5` are installed from session 1. Add nothing new.
- Parsing stays on the server (`read-excel-file`, `write-excel-file`). The app sends bytes and renders the report.
- `UPLOAD_STATUS`, `UPLOAD_ROW_RESULT`, `UPLOAD_ROW_RESULT_META`, `LeadSourceUploadSummary` and
  `LeadSourceUploadReport` come from the copied `src/constants/` and `src/types/`. No literal numbers in logic.
- NativeWind `className` with the web's Tailwind strings; cards, buttons, inputs, chips, skeletons and sheets are the
  session 3 primitives, `DayChoice` / `AssigneeSelect` / `useAssignees` the session 11 ones, `useWriteRegion` the
  session 7 one. Lists are `useListQuery` + `ListScreen` (session 6), with no numbered pagination.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components and
  screens, files under 250 lines.

## Steps
1. Add the three upload paths to `src/api/endpoints.ts`, register the screens in `CallsStack`, and get
   `LeadSourceUploadsScreen` listing real uploads — the cheapest proof the routes and the manager gate work.
2. Build `src/lib/downloadFile.ts` and wire "Download template" to it; confirm a real workbook opens, not a JSON error body.
3. Build `LeadSourceReportScreen` against an existing upload: header card, tiles, file notes, FAILED box, the
   "Open the N imported sources" link and the two report downloads.
4. Build `ReportRows.tsx` — filter chips and search over the loaded rows, expandable cards, tap-through to `LeadSourceDetail`.
5. Build `pickSheetFile()` and `FilePickRow`, and check the name, size and local path with an .xlsx, a .csv and an .xls.
6. Build `uploadSheet()` with `.uploadProgress`, then `LeadSourceUploadScreen` (file card, header chips or the template
   fallback, region, assignee, day, progress state, back-block), and upload a real 3-row sheet end to end.
7. Force the failure paths — a renamed required column, an over-5 MB file, a role-60 account — then run `npm run lint`
   and `npx tsc --noEmit` and walk upload → report → imported sources → a source → back.

## Definition of done
- [ ] `npm run android` installs and the Uploads screen lists real uploads with region badges, counters and TimeAgo.
- [ ] "Download template" saves `lead-source-template.xlsx` and opens it in a spreadsheet viewer as a real workbook.
- [ ] Choosing a file shows its real name and size, the X clears it, and an `.xls` or an over-5 MB file is refused locally with the server's wording and no request.
- [ ] Uploading a 3-row sheet shows a progress bar that reaches 100%, toasts "3 imported", and lands on the report screen.
- [ ] The Android back button does nothing while an upload is in flight, and works again as soon as it settles.
- [ ] A sheet missing a required column shows the rose card with the server message and the headers found in the file, and the picked file stays.
- [ ] The report screen shows the four tiles matching the web for the same upload, the file notes, and the missing-columns line.
- [ ] The row cards paginate past 50, the four filter chips and the search box narrow them, and a card with `sourceId` opens that lead source.
- [ ] "Skipped rows only" appears only when `counts.skipped > 0` and saves `<file>-report-skipped.xlsx`, which opens with just those rows.
- [ ] "Open the N imported sources" returns to the list filtered by that upload, and the count matches `pagination.total`.
- [ ] A role-60 account sees `AccessDenied` on all three screens and no "Upload sheet" or "Uploads" entry points.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish Lead sources C. If blob-util cannot read the picked `content://` URI, make the local cache copy first
(`keepLocalCopy` / `copyTo`) and upload that path — that is the usual cause. If `.uploadProgress` never fires, ship the
upload with an indeterminate spinner and note it; the upload matters more than the bar. If `actionViewIntent` throws
because no app on the emulator opens .xlsx, keep the file in the cache directory, toast its path, and verify on a device
with an Office app. If the downloads return 401, check BACKEND_CHANGES.md item 5 on the dev API — both .xlsx routes must
read the Bearer header. Report what is left.
