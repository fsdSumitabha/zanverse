# Session 07 — Leads module

Five working lead screens on the device: browse leads, create one, open it, move it through the pipeline with remarks, edit it, and convert it to a client.

---

Session 07 — Leads module.

Read docs/OVERVIEW.md §3 (Data, Forms, Navigation, Styling, Region), §4 (packages), §5 (structure), §6, §8 (shared code rule) and §11.6.
Read docs/SCREENS.md — the five `/admin/operations/leads*` sections, in particular the detail screen's nine "On a phone" points.
Read docs/API_CONTRACT.md — the seven lead rows in the endpoint table and "RESPONSE SHAPE INCONSISTENCIES".
Read docs/CLIENT_SYSTEMS.md — "StatusContext" and "Phone input handling" (the recommendation to copy `lib/phone.ts` and rebuild only the field).
Read docs/COMPONENTS.md — the rows for `LeadCard.tsx`, `LeadDetails.tsx`, `LeadForm.tsx` and `WhatsAppLink.tsx`.

Reference (read-only): D:\zan-workspace —
`src/app/admin/operations/leads/LeadsClient.tsx`, `src/components/admin/operations/LeadCard.tsx`,
`src/components/admin/operations/skeletons/LeadCardSkeleton.tsx` and `skeletons/LeadDetailsSkeleton.tsx`,
`src/app/admin/operations/leads/[leadId]/page.tsx`, `src/components/admin/operations/LeadDetails.tsx`,
`src/components/admin/operations/statusDropdowns/LeadStatusDropdown.tsx`,
`src/components/admin/operations/LeadInteractionActions.tsx`, `src/components/admin/operations/ConvertClientButton.tsx`,
`src/components/admin/operations/button/WhatsAppLink.tsx`,
`src/components/admin/operations/LeadForm.tsx`, `src/components/admin/operations/region/WriteRegionField.tsx`,
`src/components/phone/PhoneField.tsx`, `CountrySelect.tsx`, `PhoneHint.tsx`, `PhoneText.tsx`, `useEditablePhone.ts`,
`src/app/admin/operations/leads/[leadId]/convert/page.tsx`, `src/components/admin/operations/LeadInfoCard.tsx`.

## Goal
The Leads tab lists real leads with infinite scroll, filters and search on the session 6 kit. Tapping a card opens the
lead: header card, a status sheet that collects required remarks and PATCHes, the Converted-to-Client block once
converted, an Edit link, a Convert action at status 50 and a Delete for Admin. Create and edit run through one form with
a real RN phone field. Convert creates the client and lands on it. The four add-interaction buttons render and are wired
in session 8.

## Scope
- `src/components/leads/LeadCard.tsx` — name + company, `Badge` from `LEAD_STATUS_META`, `PhoneText`, email, source,
  `TimeAgo` on `createdAt`, and "Created by <name>" as visible text (the web's hover Tooltip). Convert gets its own
  full-width row under the contact lines instead of the web's `absolute top-1/2 right-0` overlay, and shows only at
  `status === LEAD_STATUS.NEGOTIATION`. Press anywhere else navigates to `LeadDetail` with `{ id: lead._id }`.
- `src/components/leads/LeadCardSkeleton.tsx` and `LeadDetailsSkeleton.tsx` — rebuilt from the session 3 `Skeleton`.
- `src/screens/leads/LeadsListScreen.tsx` — `useListQuery` + `ListScreen` from session 6 against
  `GET /api/admin/operations/leads?page&limit=10&search&status&from&to`, `statusMeta={LEAD_STATUS_META}`, the
  "N leads found" count line from `pagination.total` (keep the singular "1 lead found"), a "Create New Lead" header
  button and a `Fab`, both navigating to `LeadCreate`.
- `src/screens/leads/LeadDetailScreen.tsx` — `GET /api/admin/operations/leads/:id`, reading the nested `data.lead` and
  `data.client`, in a `ScrollView` with pull-to-refresh. Four states: skeleton, "Lead not found", `AccessDenied` on 403,
  content. Refetch after a successful status change and on focus.
- `src/components/leads/LeadDetailsCard.tsx` — name, source, phone row via `WhatsAppLink`, email, "Created:" absolute
  date, the status trigger, and the Edit link shown only for `LEAD_EDIT_ROLES = [10, 15, 60, 69, 45, 70]`.
- `src/components/leads/LeadStatusSheet.tsx` — the dropdown as a `Modal` sheet in two steps, both inside the same sheet,
  driven by the `StatusContext` copied in session 4 (`nextStatus`, `showRemarks`, `remarks`, `reset`). Step 1 lists
  `LEAD_STATUS_META` with the current value check-marked and `LEAD_STATUS.CONVERTED` filtered out; step 2 is a required
  remarks `Textarea` with Cancel / Confirm, erroring "Remarks are required" on blank. Confirm PATCHes
  `/api/admin/operations/leads/:id/status` with `{ status, remarks }`, toasts "Status updated", then `reset()`. The
  trigger is inert when `status >= LEAD_STATUS.CONVERTED` and reads "Updating..." while saving.
- `src/components/leads/ConvertedClientBlock.tsx` — rendered when `client` is non-null: Name, Company, client status
  `Badge` from `CLIENT_STATUS_META`, `TimeAgo` on `client.createdAt`, in two columns, plus a "View client" link to
  `ClientDetail` with `{ id: client._id }`.
- `src/components/leads/LeadInteractionActions.tsx` — the four buttons from `INTERACTION_TYPE.CALL_MADE`,
  `MEETING_SCHEDULED`, `NOTE_ADDED`, `QUOTATION_SENT` with `INTERACTION_TYPE_META` labels and colours. `onPress` raises
  a toast "Available in the next session"; keep the `onAction(type)` prop signature session 8 will use.
- Delete: only when `role === 10`, behind `Alert.alert("Delete this lead?")`, calling
  `DELETE /api/admin/operations/leads/:id` then `navigation.replace("LeadsList")`, toasting the server's message.
- `src/components/phone/` — `useEditablePhone.ts` with the web's exact contract (`check({ focus })`, `error`, `setError`,
  `reset`, `savedInvalid`, `fieldProps`), but holding the typed text in state/ref instead of `inputRef.current.value`,
  and keeping both saved-value rules: an invalid saved value with an empty box returns `savedPhone`, and an unchanged
  number returns `savedPhone`, not the re-formatted E.164. `PhoneField.tsx` is a `TextInput` plus a country `SelectSheet`
  ordered IN, US, AE then the rest and labelled with `getCountryCallingCode`; "+" is rejected with the `PHONE_MESSAGES`
  text, no max length is enforced, and the paste guard becomes an `onChangeText` check running `checkPastedPhone` on a
  multi-character jump. `PhoneHint.tsx` and `PhoneText.tsx` port as-is; `WhatsAppLink.tsx` uses `toWhatsAppNumber` +
  `Linking.openURL("https://wa.me/<number>")` and stays plain grey text for an invalid number.
- `src/components/leads/LeadForm.tsx` — one form for both modes: Name*, Phone*, Email, Source* and, on create only, the
  region field. `useWriteRegion()` ported from `WriteRegionField.tsx` (options = the regions in scope, India
  preselected, fixed when pinned) rendered as a `SelectSheet`. Submit POSTs `/api/admin/operations/leads` or PATCHes
  `/api/admin/operations/leads/:id`; a body carrying `field === "phone"` calls `phone.setError(message)` instead of
  toasting, and "Please fill required fields" guards a blank name or source. On success toast and navigate to
  `LeadDetail` with the new `data._id` (create) or the existing id (edit).
- `src/screens/leads/LeadCreateScreen.tsx`, `LeadEditScreen.tsx` (seeded from `data.lead`), and
  `LeadConvertScreen.tsx` — read-only `LeadInfoCard` plus one required Company field posting
  `/api/admin/operations/leads/:id/convert`; on success toast and navigate straight to `ClientDetail` with
  `data.clientId`, with no 2-second wait.

## Already decided (follow these)
- Lists are session 6's `useListQuery` + `ListScreen` + `ListFilters`; `{ page, limit, total, pages }` and `PAGE_SIZE` 10
  stay exactly as they are.
- Every request goes through `src/api/client.ts` (`send`, `ApiError` with `status`/`field`), which already handles 401.
  A 403 renders the session 3 `AccessDenied` with the server's message.
- Screen names are already registered in session 5: `LeadsList`, `LeadDetail`, `LeadCreate`, `LeadEdit`, `LeadConvert`.
  `canOpen` already gates `LeadCreate` `[10,15,45,50,60,69,70]`, `LeadEdit` and `LeadConvert` `[10,45,60,69,70]` — hide
  those entry points for other roles rather than adding new checks.
- Statuses, labels and colours come from the copied `src/constants/leadStatus.ts`, `clientStatus.ts` and
  `interactionTypes.ts` — never a literal number or label.
- UI comes from `src/components/ui/`: `Card`, `Button`, `Badge`, `Input`, `Textarea`, `SelectSheet`, `Dialog`,
  `Skeleton`, `EmptyState`, `Fab`, `TimeAgo`, `AccessDenied`, and `notify` for toasts.
- Forms are plain `useState` with the server's `{ field, message }` routed back to the field. No react-hook-form, no zod.
- Keyboard handling is RN's `KeyboardAvoidingView` plus a `ScrollView` with `keyboardShouldPersistTaps="handled"`;
  `keyboardType` is `"phone-pad"` for phone and `"email-address"` for email.
- `libphonenumber-js@^1.13` and `src/lib/phone.ts` are the session 2 verbatim copies — import them, do not re-derive
  validation. The timeline, the four interaction forms and the dialer belong to sessions 8 and 12.
- Style: 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export per
  component and screen, files under 250 lines, 44dp touch targets.

## Steps
1. Build `LeadCard` + `LeadCardSkeleton`, swap them into a `LeadsListScreen` on the session 6 kit, and confirm paging,
   filters and search still behave on the device.
2. Port the `src/lib/phone.ts` consumers — `PhoneText`, `PhoneHint`, `WhatsAppLink`, `useEditablePhone`, then
   `PhoneField` with its country sheet. Test typing, pasting a number with text around it, "+", and one digit too many.
3. Build `LeadForm` with `useWriteRegion`, wire `LeadCreateScreen`, and create a lead end to end.
4. Wire `LeadEditScreen` from `data.lead` and confirm saving with an untouched legacy phone value succeeds.
5. Build `LeadDetailsCard`, `LeadStatusSheet` on `StatusContext`, and `ConvertedClientBlock`; move a lead 10 → 20 with
   remarks and watch the card refresh.
6. Add `LeadInteractionActions` (stubbed) and the Admin-only Delete behind `Alert`.
7. Build `LeadConvertScreen` + `LeadInfoCard`, convert a status-50 lead, and check the lead reopens at status 60 with
   the Converted-to-Client block.
8. Run the Definition of done on the emulator with an Admin (10) account and one non-admin (e.g. 50 or 65).

## Definition of done
- [ ] `npm run android` installs and the Leads tab lists 10 leads, appends the next page on scroll and refreshes on pull.
- [ ] The status filter and a 2-character search both reset to page 1 and the count line matches `pagination.total`.
- [ ] A status-50 card shows "Convert To Client" on its own row with no text overlap at 360dp width.
- [ ] Tapping a card opens the lead with name, source, phone, email and created date; the phone row opens WhatsApp.
- [ ] Changing status asks for remarks, rejects a blank one, PATCHes once, toasts "Status updated" and the header card
      shows the new badge without leaving the screen.
- [ ] A lead at status 60 or 70 has an inert status trigger, and "Converted" never appears in the sheet's options.
- [ ] Creating a lead with an invalid phone shows the server's message under the phone field and nothing is created;
      a valid one lands on the new lead's detail screen.
- [ ] Editing a lead whose saved phone is a legacy value such as `9876543210` saves the other fields with no phone error.
- [ ] Converting a status-50 lead lands on the client detail screen immediately, and reopening the lead shows status 60
      and the Converted-to-Client block with a working "View client" link.
- [ ] As role 10 the Delete button appears, the `Alert` confirms and the list reopens without the lead; as role 50 the
      Delete button and the Edit link are absent.
- [ ] A role outside `[10,15,50,60,65,69,70,45]` sees `AccessDenied`; an unknown id shows "Lead not found".
- [ ] The four interaction buttons render with their `INTERACTION_TYPE_META` labels and colours.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish the leads module. The likeliest sticking point is `PhoneField`: if the country sheet or the paste guard is
unfinished, ship a `TextInput` with `keyboardType="phone-pad"` fixed to the region's `phoneCountry` behind the same
`fieldProps` contract, keep `check()` and the two saved-value rules exactly as they are, and note the gap. If instead
the detail screen is incomplete, finish `LeadStatusSheet` (two steps in one `Modal`, remarks required, refetch after the
PATCH) before Convert and Delete, then re-run the Definition of done and stop.
