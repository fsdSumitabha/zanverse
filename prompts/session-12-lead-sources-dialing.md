# Session 12 — Lead sources B: dialing, detail, convert

One tap on a row opens the Android dialer with the number, and the source detail screen works end to end: notes, callback, manager actions and convert to lead.

---

Session 12 — Lead sources B: dialing, detail, convert.

Read docs/OVERVIEW.md §3 (Dialer, Data, Navigation, Styling), §4 (packages), §5 (structure), §8 (shared code rule).
Read docs/LEAD_SOURCES.md "Status model", "Roles and access", `/admin/operations/lead-sources/[sourceId]`,
the flows "Add a note without changing the status", "Callback scheduling", "Convert to lead", the "Components" rows for
`dialer.ts`, `ActivityTimeline.tsx`, `NoteBox.tsx`, `SheetData.tsx`, `CallButton.tsx`, and the risks "DO-NOT-CALL /
TCPA EXPOSURE" and "THE DETAIL ROUTE RETURNS THE WHOLE ACTIVITY ARRAY".
Read docs/API_CONTRACT.md rows for `/lead-sources/:id`, `/:id/notes`, `/:id/callback`, `/:id/convert`, `/bulk`, and
docs/COMPONENTS.md rows for `button/WhatsAppLink.tsx` and `dayjs/TimeAgo.tsx`.

Reference (read-only): reference/zan-workspace —
`src/components/admin/operations/lead-sources/dialer.ts` (the whole seam, 34 lines),
`src/app/admin/operations/lead-sources/[sourceId]/page.tsx` (the screen to port, 339 lines),
`src/components/admin/operations/lead-sources/ActivityTimeline.tsx`, `NoteBox.tsx`, `SheetData.tsx`,
`ActionDialogs.tsx` (`runBulk`, AssignDialog, DayDialog, DeleteDialog), `CallButton.tsx`, `callback.ts`,
`src/components/admin/operations/button/WhatsAppLink.tsx`, `src/lib/phone.ts` (`toWhatsAppNumber`,
`formatPhoneForDisplay`), `src/lib/lead-sources/day.ts` (`formatDay`, `todayString`),
`src/constants/leadSourceRoles.ts`, `src/constants/leadSourceStatus.ts`, `src/types/leadSource.ts`.

## Goal
Tapping the green call button anywhere in the lead sources module opens the Android dialer pre-filled with the number,
with WhatsApp and email as second actions. The detail screen for one source is complete: header with status menu, call,
callback button, phone/email/assignee/day/region/source-file grid, the manager action row, "Add a note", the upload
warnings, "From the sheet", the activity timeline, and "Convert to lead" for CONVERT roles — which creates the Lead and
navigates to it.

## Scope
- `src/lib/contact.ts` — three functions over `Linking`:
  - `startCall(source: { name, phone }, phoneCountry)` — `Linking.openURL("tel:" + source.phone)`, and in `.catch()` the
    web toast kept verbatim: title `Call ${source.name}`, id `"lead-source-call"`, body
    `${formatPhoneForDisplay(source.phone, phoneCountry)}. Calling from the CRM is not set up yet. Dial this number on your phone.`
  - `openWhatsApp(phone, phoneCountry)` — `toWhatsAppNumber()` from `src/lib/phone.ts`, then
    `https://wa.me/<digits>?text=` so it degrades to the browser when WhatsApp is absent; no number means no action.
  - `openEmail(email)` — `mailto:<email>`.
  Each one uses `openURL().catch()` rather than `canOpenURL`.
- Session 11's `dialer.ts` keeps its path and re-exports `startCall` from `src/lib/contact.ts`, so every existing
  import and `CallButton` keep working untouched.
- `android/app/src/main/AndroidManifest.xml` — a `<queries>` block with `android.intent.action.DIAL` + `tel:`,
  `android.intent.action.VIEW` + `https`, `<package android:name="com.whatsapp" />` and `com.whatsapp.w4b`.
- `src/components/ui/ContactRow.tsx` — the shared phone / email row: a WhatsApp-green phone line showing
  `formatPhoneForDisplay(phone, phoneCountry)` that calls `openWhatsApp`, grey plain text for an invalid number (the
  web's `WhatsAppLink` fallback), and a blue email line with the `Mail` icon calling `openEmail`. Drop it into the
  lead source detail screen this session, and into the Leads and Clients detail screens (the `lead.email` and
  `client.email` blocks) so every email field in the app is tappable.
- `src/screens/leadSources/LeadSourceDetailScreen.tsx` — route param `sourceId`, `GET /api/admin/operations/lead-sources/:id`
  through `send` from `src/api/client.ts`, three skeleton cards while loading, `AccessDenied` on 403, and the web's
  "Lead source not found" card (with "It may have been deleted, or it is assigned to someone else.") when `data` is null.
  `onUpdated(row)` merges the returned `LeadSourceRow` into the `LeadSourceDetail` and reloads, exactly as the web does.
- Header card: name, `listInfo.join(" · ")`, session 11's `StatusMenu` at `size="md"`, `CallButton size="md"`, then a
  full-width `CallbackMenu variant="button"` with `useNow(15_000)` — both hidden once
  `status === LEAD_SOURCE_STATUS.CONVERTED`.
- The detail grid: Phone and Email as `ContactRow`, "Assigned to" (`assignee?.name || "Nobody yet"`), "Day"
  (`formatDay(allottedDay, today)` or "No day", plus the amber "left over" badge when `allottedDay < today` and not
  converted), `RegionBadge`, and the source file line `fileName, row N` — a link to the upload report only for managers.
- Manager action row (`canManageLeadSources(role)`): Assign, Set day, Delete — all three post to
  `POST /lead-sources/bulk` with `{ ids: [source._id], action, today: todayLocal(), ... }`, reusing session 11's
  Assign/Day/Delete sheets. Delete navigates back to the list. "Convert to lead" sits at the end for
  `canConvertLeadSources(role)` while not converted.
- Convert sheet: title `Convert ${name} to a lead?`, description "A new lead is created in the Leads list, in this
  region.", the four bullets kept word for word ("The lead gets the name, phone, email and region." / "It is assigned to
  {assignee?.name || "you"}." / "Everything else from the sheet, and every note from the calls, goes into its first
  note." / "This source is then marked Converted and closed."), buttons Cancel and "Create lead" (→ "Creating..." while
  in flight). `POST /lead-sources/:id/convert` with `{}` → toast "Lead created" → navigate to the Lead detail screen
  with the returned `leadId`. An `ApiError` toasts the server message (409 already-converted, 409 duplicate lead phone
  with `field: "phone"`) and leaves the sheet closed.
- Converted banner: the blue card "This source is now a lead. Keep working on it there." with "Open {convertedLead.name}"
  navigating to that lead.
- `src/components/leadSources/NoteBox.tsx` — `TextInput` `multiline`, `maxLength={2000}`, placeholder "What did you learn
  on the call?", an "Add note" button (disabled while empty or saving, "Adding..." in flight);
  `POST /:id/notes` `{ text: text.trim() }` → 201 row → clear, `onAdded(row)`, toast "Note added". No Ctrl+Enter hint on
  a phone — the button is the only way.
- `src/components/leadSources/ImportNotes.tsx` — the amber "Notes from the upload check" card over `importNotes`.
- `src/components/leadSources/SheetData.tsx` — every non-empty cell of `data`, labelled from a new
  `src/constants/leadSourceColumns.ts` (key, label, kind copied from the web's `src/config/leadSourceSheet.ts`),
  `date` kinds shown as `3 Apr 2021`, unknown keys humanized and marked "(extra column)" last, and the empty text
  "The sheet row had no other values."
- `src/components/leadSources/ActivityTimeline.tsx` — the embedded `activity` array newest first, one `lucide-react-native`
  icon per `LEAD_SOURCE_ACTIVITY` code (10 FileUp, 20 StickyNote, 30 ListChecks, 40 AlarmClock, 50 UserRound, 60
  CalendarDays, 70 ArrowRightLeft, default StickyNote), the per-type sentences ported as `<Text>` runs with inline
  `StatusPill`s and `formatCallback()`, `TimeAgo` for the time, the note text in a grey block (skipped for type 10), and
  "Nothing yet." when empty.

## Already decided (follow these)
- Dialing is `Linking.openURL("tel:…")` inside `startCall()` — the one function every call button in the module already
  goes through. No Twilio, no call logging, no recording this session.
- Plain `fetch` + `useState`/`useEffect` through `src/api/client.ts` (`send`, `ApiError`, 401 handled inside).
- NativeWind `className` with the web's Tailwind strings; cards, sheets, buttons, `StatusPill` and skeletons come from
  the session 3 primitives in `src/components/ui/`.
- Status codes, activity codes and role arrays come from the copied `src/constants/leadSourceStatus.ts` and
  `leadSourceRoles.ts` (ACCESS [10,15,45,50,60,65,69,70], MANAGE [10,15,45,69], CONVERT [10,15,45,50,60,69,70]) via
  `canManageLeadSources` / `canConvertLeadSources`. Status 60 is retired — the renderer falls back to grey "Unknown".
- `today` is always `todayLocal()` / the copied `toDayString`, never `toISOString`.
- Navigation is React Navigation 7 native-stack; the detail screen is pushed from the session 11 list row.
- Packages installed already: `lucide-react-native@^1.49`, `dayjs@^1.11`, `clsx@^2`, `libphonenumber-js@^1.13`,
  `react-native-toast-message@^2.5`. Add nothing new this session.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components and
  screens, files under 250 lines.

## Steps
1. Write `src/lib/contact.ts`, point `dialer.ts` at it, and prove the dialer from session 11's list row before any new
   screen exists — this is the payoff and it is three lines.
2. Add the `<queries>` block to `AndroidManifest.xml` and rebuild with `npm run android` (a manifest change needs a full
   rebuild, not a reload).
3. Build `ContactRow` and use it in the Leads and Clients detail screens; check WhatsApp with the app installed and with
   it uninstalled (the `wa.me` URL must open the browser).
4. Build `LeadSourceDetailScreen` shell: load, skeletons, `AccessDenied`, not-found card, header card with `StatusMenu`,
   `CallButton` and `CallbackMenu`, then the detail grid.
5. Add `NoteBox`, `ImportNotes`, `SheetData` and `ActivityTimeline` as separate files, each rendered in its own card.
6. Wire the manager action row to the bulk endpoint with a single id, reusing the session 11 sheets.
7. Add the convert sheet and the converted banner, then convert a real test source on the dev API and land on the Lead
   detail screen.
8. Log the DNC/TCPA question in the summary: one-tap dialing now exists, and a distinct do-not-call status is still a
   backend decision.

## Definition of done
- [ ] `npm run android` installs, and tapping the call button on a list row opens the Android dialer with the number filled in.
- [ ] The WhatsApp action opens a chat with the right number when WhatsApp is installed, and the browser when it is not.
- [ ] Tapping an email on the lead source, lead and client detail screens opens the mail app.
- [ ] The detail screen for a source with sheet data and several activity entries shows all seven cards with no clipped
      text at 360dp width.
- [ ] A note saves, clears the field, toasts "Note added", and appears as a new timeline entry after the reload.
- [ ] Picking Call Back in the status menu and setting a time updates the header callback button, and clearing it works.
- [ ] A manager can Assign, Set day and Delete from the detail screen; Delete returns to the list and the row is gone.
- [ ] A CONVERT role converts a source: a Lead is created, the app lands on that Lead's detail screen, and reopening the
      source shows the blue banner with the status locked to Converted and the call/callback controls hidden.
- [ ] A role in ACCESS but outside CONVERT sees no "Convert to lead" button, and a non-manager sees no Assign/Set day/Delete.
- [ ] Converting an already-converted source toasts the server's 409 message instead of crashing.
- [ ] A source id belonging to someone else's assignment shows the "Lead source not found" card (the API returns 404).
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish Lead sources B. If `Linking.openURL("tel:…")` throws on the emulator, test on a real device — emulators often
have no dialer — and keep the `.catch()` toast as the fallback path. If WhatsApp still does not resolve, confirm the
`<queries>` block is inside `<manifest>` (not `<application>`) and that the number from `toWhatsAppNumber` has no `+`.
If the convert call succeeds but navigation fails, check the Lead detail route name and params from session 7 and
navigate with the returned `leadId` only. Report what is left.
