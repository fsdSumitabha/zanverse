# Session 16 — Users module

A working staff directory on the device, plus create and edit over one UserForm with the web's exact edit diff, region grant rules and avatar upload.

---

Session 16 — Users module.

Read docs/OVERVIEW.md §3 (Data, Forms, Files, Navigation, Styling, Region), §4 (packages), §5 (structure), §6, §8 (shared code rule) and §11.6.
Read docs/SCREENS.md — the three `/admin/operations/users*` sections (list, create, `[userId]/edit`), including their "On a phone" notes.
Read docs/API_CONTRACT.md — the five `users` rows in the endpoint table and the FILE UPLOADS paragraph (FormData with `{ uri, name, type }`, never set `Content-Type`).
Read docs/COMPONENTS.md — the rows for `UserCard.tsx`, `UserCardSkeleton.tsx`, `UserForm.tsx`, `RegionSelect.tsx`, `RegionBadge.tsx`, `FileUpload.tsx`, `AvatarPreview.tsx`.
Read docs/SHARED_CODE.md — `userRoles.ts` (USER_ROLE_META, `canAdministerAllRegions`, CROSS_REGION_USER_ADMIN_ROLES) and `lib/region.ts` (REGION_CODES, REGIONS).

Reference (read-only): reference/zan-workspace —
`src/app/admin/operations/users/UsersClient.tsx`, `src/app/admin/operations/users/create/page.tsx`,
`src/app/admin/operations/users/[userId]/edit/page.tsx`,
`src/components/admin/operations/UserCard.tsx`, `UserCardSkeleton.tsx`, `UserForm.tsx`,
`src/components/admin/operations/region/RegionSelect.tsx`, `region/RegionBadge.tsx`,
`src/components/admin/operations/AvatarPreview.tsx`, `dropzone/FileUpload.tsx`,
`src/app/api/admin/operations/users/route.ts`, `src/app/api/admin/operations/users/[id]/route.ts`,
`src/app/api/admin/operations/users/picker/route.ts`.

## Goal
The Users tab lists staff with infinite scroll, search and pull-to-refresh. An admin taps the pencil on a card to edit,
or the FAB to create, and both run through one `UserForm`: name, email, password, role sheet, region multi-select with
the grant rules, Active switch and an avatar picked from the gallery. Saving an edit sends only the fields that changed,
and a save with nothing changed shows "Nothing changed yet" without touching the network.

## Scope
- `src/components/users/UserCard.tsx` — `Avatar` (falls back to the initial), name, email, Active/Inactive pill,
  `opacity-60` on inactive, "Role :" with the `USER_ROLE_META[role].label`, the description as an `InlineValue` line,
  "Joined" `TimeAgo` on `createdAt`, a Regions row of `RegionBadge`s (red "No region" when empty), `Last login` `TimeAgo`
  or "No login yet", "Disabled" on the inactive footer, and "Created by <name>" as plain text. The web's absolutely
  positioned pencil becomes a trailing `Pencil` icon button in the header row (44dp) navigating to `UserEdit` with
  `{ id: user._id }`, rendered only when `canOpen("UserEdit", role)`.
- `src/components/users/UserCardSkeleton.tsx` — rebuilt from the session 3 `Skeleton`, 5 of them while page 1 loads.
- `src/screens/users/UsersListScreen.tsx` — `useListQuery` + `ListScreen` from session 6 against
  `GET /api/admin/operations/users?page&limit=10&search`, the "N users found" count line from `pagination.total`
  (singular "1 user found"), "No users found" empty text, a "Create New User" header button and a `Fab` with
  `extraBottom={useBottomTabBarHeight()}`, both gated on role `10 | 20 | 69` and navigating to `UserCreate`.
- `src/components/region/RegionBadge.tsx` — the IN/US/AE pill plus a `RegionBadges` row, from the web's classes
  (create it here if session 12 has not already; otherwise import the existing one).
- `src/components/users/RegionSelect.tsx` — the three grant rules ported verbatim: `grantable` is `REGION_CODES` when
  `canAdministerAllRegions(role)` else the signed-in user's `regions`; a region the account already holds that you cannot
  grant renders ticked, locked and disabled; `toggle` rebuilds the value from `REGION_CODES` so order never depends on
  tap order. Rendered as a `SelectSheet`-style `Modal` list with check boxes, a `Lock` row for locked regions, the
  "Pick at least one. An account with no region sees an empty app." hint, and the single-region hint. When
  `lockedReason` is set, show the locked read-only row with its text instead of the control.
- `src/components/users/UserForm.tsx` — one form, `mode="create" | "edit"`: Name*, Email* (`keyboardType="email-address"`,
  `autoCapitalize="none"`), Password (required on create, "Leave blank to keep the current password" on edit, with the
  "Setting a password here replaces the current one immediately." note, `secureTextEntry`, `autoComplete="new-password"`,
  minimum 6 characters), a role `SelectSheet` from `USER_ROLE_META` with role `10` filtered out unless the loaded user
  already holds it and the selected role's `description` under it, `RegionSelect`, an `Active User` RN `<Switch>`, and
  the avatar block. Keep `regionError = "Pick at least one region"` when regions are empty and not locked. Keep the
  defaults: `role` = first selectable role, `regions` = your own region when you hold exactly one.
- `src/components/users/AvatarField.tsx` — replaces `FileUpload` + `AvatarPreview`: a circular preview (picked file,
  else the existing `avatar` URL) with Replace / Remove, and a "Choose image" button calling
  `launchImageLibrary` from `react-native-image-picker@^8.2`. Enforce `image/jpeg | image/png` and 5 MB client-side with
  the server's own messages ("Invalid file type", "File too large (max 5MB)"), keep the `formatSize` label, and hold the
  result as `{ uri, name, type }`.
- `src/lib/userDiff.ts` — `buildUserFormData(form, mode, loaded?)` holding the edit diff exactly as the web writes it:
  `name` when trimmed differs, `email` when the lower-cased value differs, `role` and `isActive` when different,
  `regions` as repeated entries **only when the sorted join differs**, `password` only when non-blank, `avatarFile` when
  one was picked, `removeAvatar: "true"` when the user had an avatar and it was cleared. Create mode appends name, email,
  password, role, every region and `isActive`. The regions rule is load-bearing: sending an unchanged list turns a
  self-edit into the API's 403 "You cannot change your own regions".
- `src/screens/users/UserCreateScreen.tsx` — `POST /api/admin/operations/users` with the FormData from `buildUserFormData`,
  behind a `Dialog` confirm ("Create this account? The password is emailed to them."), the loading → success/error toast
  chain on one `notify` id, then navigate to `UsersList`. Surface 409 "Email already exists" on the email field.
- `src/screens/users/UserEditScreen.tsx` — `GET /api/admin/operations/users/:id` with the `ignore` cleanup flag, three
  states (a "Loading user..." card, a "This user could not be loaded" card with "Back to users", or the form keyed on
  `user._id`), `regionsLockedReason = "You cannot change your own regions. Ask another admin."` when
  `signedInUser.id === user._id`, and a `PATCH` of the diff. An empty FormData shows `notify.info("Nothing changed yet")`
  and sends nothing. Route the server's 403s ("You cannot change your own role", "You cannot deactivate your own
  account") to a toast and leave the form as it is.
- `src/components/users/UserPickerSheet.tsx` — `GET /api/admin/operations/users/picker?search&limit=50` returning
  `{ _id, name, email, role, avatar }`, a searchable modal list for the meetings attendee picker. Reuse whatever
  session 14 built if it already exists; otherwise build it here and leave it exported.
- `__tests__/userDiff.test.ts` — unit tests for `buildUserFormData`: no changes → empty, a re-ordered identical region
  array → no `regions` key, a changed region set → one entry per region, blank password → no `password`, cleared avatar
  on a user who had one → `removeAvatar`.

## Already decided (follow these)
- Lists are session 6's `useListQuery` + `ListScreen`; `{ page, limit, total, pages }` stays as it is and `limit` is 10
  (the web's numbered pagination used 5; infinite scroll does not need it).
- Every request goes through `src/api/client.ts` `send` / `sendRaw` from session 4, which handles 401 and the FormData
  branch (no manual `Content-Type`). `ApiError.status === 403` renders the session 3 `AccessDenied` with the server's
  message; `ApiError.field` goes under that field.
- Screen names `UsersList`, `UserCreate`, `UserEdit` are registered in `UsersStack` from session 5, and
  `src/navigation/permissions.ts` already gates UsersList `[10,45,20,69]`, UserCreate `[10,20,69]`, UserEdit `[10,20]` —
  hide entry points rather than adding new checks. Note the known gap: the API `GET /users` allows `[10,15,20,69]`, so a
  role-45 account opens the screen and gets `AccessDenied` from the 403.
- Roles, labels and descriptions come from the copied `src/constants/userRoles.ts`; regions from the copied
  `src/lib/region.ts`. Never a literal role number or label in a component.
- UI comes from `src/components/ui/`: `Card`, `Button`, `Badge`, `Input`, `SelectSheet`, `Dialog`, `Skeleton`,
  `EmptyState`, `Avatar`, `Fab`, `TimeAgo`, `InlineValue`, `AccessDenied`, plus `notify` for toasts.
- Forms are plain `useState` with the server's `{ field, message }` routed back to the field. No react-hook-form, no zod.
- This is the longest form in the app: wrap it in `KeyboardAvoidingView` with a `ScrollView` using
  `keyboardShouldPersistTaps="handled"`, and keep every tap target at 44dp.
- Style: 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, one default export per
  component and screen, files under 250 lines.

## Steps
1. Build `RegionBadge`, `UserCard` and `UserCardSkeleton`, then `UsersListScreen` on the session 6 kit; confirm paging,
   search and pull-to-refresh on the device as role 10.
2. Write `src/lib/userDiff.ts` with its tests first, and get `npm test` green before any screen uses it.
3. Build `RegionSelect` with the grant rules, checking it against a single-region account and an admin.
4. Build `AvatarField` on `react-native-image-picker`, testing a JPEG, a PNG, an oversized image and a cancel.
5. Assemble `UserForm` with the role sheet, Active switch, password rules and region error.
6. Wire `UserCreateScreen` with the confirm dialog and create a real account on the dev API.
7. Wire `UserEditScreen` with the three load states, the self-edit locked regions and the diff PATCH.
8. Add `UserPickerSheet`, then run the Definition of done with an Admin (10), an HR (20) and a non-admin (e.g. 50).

## Definition of done
- [ ] `npm run android` installs and the Users tab lists users, appends the next page on scroll and refreshes on pull.
- [ ] A 2-character search resets to page 1 and the count line matches `pagination.total`.
- [ ] An inactive user's card is dimmed, shows "Inactive" and "Disabled", and its regions row shows real badges.
- [ ] The FAB clears the bottom tab bar at 360dp and is absent for a role outside `[10,20,69]`.
- [ ] Creating a user with a JPEG avatar succeeds, toasts the new name with the email, and the new row appears in the list.
- [ ] A duplicate email shows "Email already exists" and creates nothing.
- [ ] Picking a 6 MB image or a non-JPEG/PNG file is refused in the app with the server's wording and no request is sent.
- [ ] Saving an edit with nothing touched shows "Nothing changed yet" and sends no request (check the Metro network log).
- [ ] Editing only the name of your own account succeeds — the PATCH body carries `name` and no `regions`.
- [ ] Editing your own account shows the locked regions row with "You cannot change your own regions. Ask another admin."
- [ ] A single-region admin can only tick their own region; a region the edited account already holds is ticked, locked
      and not removable.
- [ ] Submitting with no region selected shows "Pick at least one region" and sends nothing.
- [ ] Opening UserEdit as role 69 renders `AccessDenied`; an unknown id shows "This user could not be loaded" with a
      working "Back to users".
- [ ] `npm test`, `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish the users module. The likeliest sticking point is the avatar upload: if `react-native-image-picker@^8.2` fails to
link or returns no `type`/`fileSize`, derive the MIME type from the file extension, keep the 5 MB and JPEG/PNG guards,
and note the gap. If instead the edit screen is unfinished, complete `buildUserFormData` plus its tests and the PATCH
path (empty FormData → "Nothing changed yet", locked regions on self-edit) before `UserPickerSheet`, then re-run the
Definition of done and stop.
