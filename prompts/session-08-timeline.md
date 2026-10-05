# Session 08 — Interactions and timeline kit

The lead detail screen shows a real timeline, and all four add-interaction forms work from the phone.

---

Session 08 — Interactions and timeline kit.

Read docs/OVERVIEW.md §3, §4, §5, §6 and §8, plus SCREENS.md `/admin/operations/leads/[leadId]` (API calls, Roles,
"On a phone" points 2, 3, 4, 6, 7, 9), COMPONENTS.md rows for `interactions/*` and `InteractionModal/*`,
API_CONTRACT.md rows for `/notes`, `/calls`, `/quotations`, `/meetings`, `/users/picker`, `/interactions/:id` and
`/leads/:id/interactions`, and SHARED_CODE.md on `INTERACTION_TYPE` / `STATUS_META_BY_ENTITY`.

Reference (read-only): reference/zan-workspace — `src/components/admin/operations/interactions/` (InteractionTimeline,
InteractionItem, InteractionEditor, EditHistory, AnimatedItem, `types/NoteItem|CallItem|MeetingItem|QuotationItem|StatusChangeItem`),
`src/components/admin/operations/InteractionModal/` (InteractionInlineForm, NoteForm, CallForm, MeetingForm, QuotationForm),
`src/components/admin/operations/LeadInteractionActions.tsx`, `MeetingLinkButton.tsx`, `dropzone/FileUpload.tsx`,
`src/app/admin/operations/leads/[leadId]/page.tsx`, and `src/app/api/admin/operations/leads/[id]/interactions/route.ts`.

## Goal
The lead detail screen built in session 7 gets its timeline: every interaction row rendered by type, notes and status
remarks editable in place, and the four `+ Call / + Meeting / + Note / + Quotation` buttons opening working full-screen
modals that save and refresh the timeline. Everything lives in `src/components/interactions/` keyed on
`entityType` + `entityId`, so sessions 9, 10 and 14 mount the same kit for clients and projects with one prop change.

## Scope
- `src/hooks/useInteractions.ts` — loads a timeline for `{ entityType, entityId }`. The three timeline routes answer
  `{ success, interactions: [...] }` at the TOP level, not inside `data`, so call it through `sendRaw` and read
  `json.interactions`. Exposes `interactions`, `loading`, `error`, `reload`. AbortController per fetch; reload after
  every write.
- `src/components/interactions/InteractionTimeline.tsx` — `FlatList`, `keyExtractor={(i) => i._id}`,
  `ListEmptyComponent` showing "No interactions yet", `InteractionItemSkeleton` rows while loading, pull-to-refresh,
  and the vertical rule as an absolutely positioned `View` behind the rows. Drop `AnimatedItem`'s staggered fade — it
  fights virtualization. The screen's header card is `ListHeaderComponent`.
- `src/components/interactions/InteractionItem.tsx` — the same `switch` on `item.type` as the web, extended to cover
  all ten codes: 2010/2020/2030/2040/2050 → `MeetingItem`, 2110 → `NoteItem`, 2210 → `CallItem`, 2410 →
  `QuotationItem`, 2510 → `StatusChangeItem`, and a new `types/DocumentItem.tsx` for 2310 (title, description,
  `item.document` name and a Linking open) so a document row no longer renders nothing.
- `src/components/interactions/types/*` — port each row's layout and class strings. Keep `StatusBadge` + the
  `INTERACTION_TYPE_META` / `MEETING_STATUS_META` / `CALL_DIRECTION_META` maps, and `STATUS_META_BY_ENTITY[entityType]`
  for the from → to pills in `StatusChangeItem` (it parses `item.title` as JSON `{ action, from, to }` inside
  try/catch; the transition itself is never editable). `MeetingItem` guards `meeting` with optional chaining — the route joins
  refIds for 2010–2040 only, so a completed-meeting (2050) row arrives with `meeting: null`. `CallItem` shows contact
  name, `PhoneText`, direction chip, call time, duration and the recording; `call.recordingUrl` is a RELATIVE
  `/uploads/calls/...` path, so prefix it with the API base before `Linking.openURL`, and replace the `<audio>` player
  with an Open button. `QuotationItem` shows `₹amount`, GST % and the inclusive total, opening the absolute ImageKit
  `quotation.url` via `Linking.openURL`.
- `src/components/interactions/MeetingLinkButton.tsx` — Join (`Linking.openURL(link)`) + Copy
  (`@react-native-clipboard/clipboard`, "Copied" for 1.5s), shown only when `meeting.meetingType === MEETING_TYPE.ONLINE`
  and `meeting.meetingLink` exists.
- `src/components/interactions/InteractionEditor.tsx` + `EditHistory.tsx` — inline edit of notes (title +
  description) and status remarks (description only, `showTitle={false}`). Same dirty check, same partial body: send
  only the changed keys to `PATCH /api/admin/operations/interactions/:id`. Keep `EditHistory`'s reversed list,
  `personName()` and `formatEditCount()` ("once"/"twice"/"thrice"/"N times") verbatim.
- Edit gate: `INTERACTION_EDIT_ROLES = [10, 15, 60, 69, 45, 50, 70]` from `useAuth().role`. The web reveals the pencil
  on `group-hover` — make it a permanently visible ≥44dp touch target.
- `src/components/interactions/InteractionActions.tsx` — the four chips from `LeadInteractionActions`, in the same
  order (`CALL_MADE`, `MEETING_SCHEDULED`, `NOTE_ADDED`, `QUOTATION_SENT`), each coloured by `INTERACTION_TYPE_META`
  and labelled `+ {meta.label}`. Pressing one navigates to its modal screen with `{ entityType, entityId }`.
- Four modal screens in `src/screens/interactions/`, registered in the leads stack with
  `presentation: "modal"`, each inside a `KeyboardAvoidingView` and saving through `src/api/client.ts`:
  - `AddNoteScreen` — title + multiline description → `POST /notes` with
    `{ entityType, entityId, type: INTERACTION_TYPE.NOTE_ADDED, title, description }`; blocks an empty description
    with "Description cannot be empty".
  - `LogCallScreen` — contact name, phone through `PhoneField` + `useEditablePhone` (`phone.check({ focus: true })`
    before submit, and a `{ field: "phone" }` response routed back via `phone.setError`), call time, duration
    (numeric), direction picker, title, notes, optional recording → multipart `POST /calls` with exactly the web's
    part names: `entityType, entityId, contactPersonName, contactPersonPhone, callTime, duration, direction, status,
    title, description, notes, recording`. Keep posting `status` as `"0"`; the route hardcodes `Call.status = 2210`
    and ignores it, so no status control is needed.
  - `ScheduleMeetingScreen` — title, agenda, description, scheduled date+time, online/offline picker
    (`MEETING_TYPE`), and the attendee list → `POST /meetings` with
    `{ entityType, entityId, title, agenda, description, meetingType, status: 2010, scheduledAt, attendees: [...ids] }`.
  - `SendQuotationScreen` — title (required), description, amount (required, numeric), GST % defaulting to `"18"`,
    optional file → multipart `POST /quotations` with parts `entityType, entityId, title, description, amount,
    gst_percentage, status (2410), file`.
- `AttendeePickerScreen` — pushed from `ScheduleMeetingScreen`, loads `GET /api/admin/operations/users/picker` once,
  filters client-side on name/email, and toggles a `Set<string>` of ids exactly as `MeetingForm` does; returns the
  selection to the form.
- Two shared primitives, because five screens need them: `src/components/ui/DateTimeField.tsx` over
  `@react-native-community/datetimepicker` (Pressable → date dialog → time dialog on Android, value in and out as a
  `Date`, ISO on submit) and `src/components/ui/FilePickerField.tsx` over `@react-native-documents/picker` (replaces
  `dropzone/FileUpload`, same MIME allowlist and the same rejection messages; append
  `{ uri, name, type }` to `FormData` and never set `Content-Type` by hand).
- `src/lib/toastPromise.ts` — one wrapper reproducing sonner's `toast.promise` loading/success/error lifecycle over
  `react-native-toast-message`, used by all four forms with the web's exact strings ("Saving note...", "Note added
  successfully", "Saving call details...", "Call logged successfully", "Scheduling meeting...", "Meeting scheduled
  successfully", "Uploading quotation...", "Quotation created successfully").
- Drop the web's `(Icons as any)[item.icon…]` lookup: `item.icon` is never present in the timeline response, so every
  row already falls through to its default. Import `FileText` / `Calendar` / `Phone` directly.
- Wire the kit into `LeadDetailScreen`: `InteractionActions` above the timeline, `reload()` after each form succeeds
  and after a status change, and the 2510 row visible without leaving the screen.

## Already decided (follow these)
- Styling is NativeWind `className` with the web's Tailwind strings copied as they are; `src/constants/` and
  `src/types/` stay byte-identical to the web app (OVERVIEW §8). Status colours come only from the `*_META` maps.
- Data: plain `fetch` through `src/api/client.ts` (`send` / `sendRaw` / `ApiError`). Screens never call `fetch`.
  `/notes`, `/calls` and `/quotations` report some failures as `error` instead of `message`, so read
  `json.message ?? json.error` when building the `ApiError`.
- Modals are plain native-stack `presentation: "modal"` screens. `@gorhom/bottom-sheet` and Reanimated stay out until
  session 21.
- Packages (OVERVIEW §4): `@react-native-community/datetimepicker@^9.2`, `@react-native-documents/picker@^12`,
  `@react-native-picker/picker@^2`, `react-native-toast-message@^2.5`, `lucide-react-native@^1.49`,
  `react-native-svg@^15.15`, `dayjs@^1.11`. Add `@react-native-clipboard/clipboard` for the Copy button.
- Lists are `FlatList`; every screen handles loading, empty, error and content; touch targets ≥44dp; `function`
  declarations, 4-space indent, no semicolons, double quotes, no `any`, `@/` imports, files under 250 lines.
- Role numbers and interaction codes come from `src/constants`, never literals in logic.

## Steps
1. Install `@react-native-community/datetimepicker`, `@react-native-documents/picker`, `@react-native-clipboard/clipboard`,
   then rebuild with `npm run android` — confirm the native linking is clean before writing UI.
2. Build `src/lib/toastPromise.ts`, `src/components/ui/DateTimeField.tsx` and `src/components/ui/FilePickerField.tsx`,
   and check each one on the emulator in isolation (a date comes back, a file comes back with uri/name/type).
3. Build `useInteractions`, `InteractionTimeline`, `InteractionItem` and the six row components, reading the real
   timeline of a lead that already has notes, calls, meetings and status changes.
4. Add `InteractionEditor` + `EditHistory` and the role-gated pencil on `NoteItem` and `StatusChangeItem`.
5. Build `AddNoteScreen` first as the template, then `SendQuotationScreen`, `LogCallScreen`, and finally
   `ScheduleMeetingScreen` + `AttendeePickerScreen`.
6. Register the five modal screens in the leads stack, wire `InteractionActions` and `reload()` into
   `LeadDetailScreen`, and walk the whole loop on the device.
7. Run `npm run lint` and `npx tsc --noEmit`.

## Definition of done
- [ ] `npm run android` builds and installs on the emulator with no red screen.
- [ ] A lead's timeline renders note, call, meeting, quotation and status-change rows, each with its
      `INTERACTION_TYPE_META` badge and a relative time; an empty lead shows "No interactions yet".
- [ ] A completed (2050) meeting row renders without crashing even though `meeting` is `null`.
- [ ] A 2510 row shows both status pills from `STATUS_META_BY_ENTITY[0]` and its remarks text.
- [ ] Adding a note returns to the detail screen and the new row appears at the top without a manual reload.
- [ ] Logging a call with a recording attached succeeds, and the saved recording opens from the timeline row.
- [ ] A quotation with a PDF succeeds; a `.txt` file is rejected locally before upload with the allowlist message.
- [ ] Scheduling an online meeting with two attendees from `/users/picker` succeeds and the row shows the Join button.
- [ ] Editing a note's description and a 2510 row's remarks both persist after pull-to-refresh, and `EditHistory`
      shows "Edited once" with the previous value.
- [ ] Signed in as a role outside `[10, 15, 60, 69, 45, 50, 70]`, no pencil is rendered on any row.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Continue session 08. If `@react-native-documents/picker@^12` or `@react-native-community/datetimepicker@^9.2` fails to
build on RN 0.87.1, report the exact Gradle error, then land the forms without that input (a plain ISO text field for
the date, no attachment part) so Note, Call, Meeting and Quotation all save, and list the picker as deferred. If the
timeline works but the forms are unfinished, finish them in the order AddNote → SendQuotation → LogCall →
ScheduleMeeting + AttendeePicker, and stop when the Definition of Done items for the ones you completed are true.
