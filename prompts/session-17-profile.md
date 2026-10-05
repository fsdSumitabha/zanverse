# Session 17 — Profile

Every signed-in user can open their own account screen, change their photo from the camera or gallery, and change their password on the device.

---

Session 17 — Profile.

Read docs/OVERVIEW.md §3 (Auth, Data, Forms, Files, Styling, Navigation), §4 (packages), §5 (structure), §8 (shared code rule).
Read docs/SCREENS.md `/admin/operations/profile` and `/admin/operations/profile/edit` (both "On a phone" paragraphs).
Read docs/API_CONTRACT.md rows for `GET /api/auth/profile`, `POST /api/auth/profile/avatar`,
`PATCH /api/auth/profile/password` and `GET /api/admin/operations/activity-logs`, plus its PER-REQUEST AUTH note about
the routes that verify the JWT themselves.
Read docs/BACKEND_CHANGES.md "Required" rows 1 and 2.

Reference (read-only): reference/zan-workspace —
`src/app/admin/operations/profile/page.tsx` (the view screen),
`src/app/admin/operations/profile/edit/page.tsx` (the edit screen, including its `PasswordField` helper),
`src/app/api/auth/profile/route.ts`, `src/app/api/auth/profile/avatar/route.ts`,
`src/app/api/auth/profile/password/route.ts` (the exact messages and status codes),
`src/types/authProfile.ts`, `src/constants/userRoles.ts` (`USER_ROLE_META`),
`src/components/admin/operations/activityLog/types.ts` (`ActivityLogRow`, `ActivityLogFilterState`, `EMPTY_FILTERS`).

## Goal
A Profile screen reachable from the header avatar menu and the "More" tab shows the signed-in user's avatar, name, email,
role label, Active/Inactive pill, member-since / last-login / profile-last-updated and who created the account, with
"My activity" paging below it. An Edit profile screen does exactly two jobs: replace the photo from camera or gallery,
and change the password with three eye-toggled fields. Name, email and role are shown read-only.

## Scope
- `src/types/authProfile.ts` — copy from the web unchanged (`AuthProfileUser`, `AuthProfileCreatedBy`).
- `src/api/endpoints.ts` — add `/api/auth/profile`, `/api/auth/profile/avatar`, `/api/auth/profile/password`.
- `src/screens/profile/ProfileScreen.tsx` — `GET /api/auth/profile` through `send` from `src/api/client.ts`. A `FlatList`
  over the activity rows with the whole profile card in `ListHeaderComponent` (never a list inside a `ScrollView`),
  pull-to-refresh reloading both, and skeleton cards while loading. The web's failure text is kept: "Could not load your
  profile." A header "Edit profile" button with the lucide `Pencil` icon pushes the edit screen.
- `src/components/profile/ProfileCard.tsx` — `Avatar` (session 3) at 96dp over `profile.avatar`, name, email with the
  `Mail` icon, a neutral role pill (`Shield` icon, `USER_ROLE_META[role].label`, falling back to `Role ${role}`) and the
  Active/Inactive pill in the web's emerald / red classes.
- `src/components/profile/ProfileFacts.tsx` — the web's `<dl>` as a label/value column: "Member since" (`Calendar`),
  "Last login" (`Clock`), "Profile last updated" (`RefreshCw`), each formatted with **dayjs** as `D MMM YYYY, h:mm A`
  and `"—"` for null, then the "Created by" block (`UserCircle`, name plus email) only when `createdBy` is set.
- `src/components/activityLog/MyActivityList.tsx` — "My activity" (`Activity` icon, subtitle "Everything you've done
  across the system."), `GET /api/admin/operations/activity-logs?page=<n>&limit=15&userId=<self>` through session 6's
  `useListQuery`, appending the next page on `onEndReached` instead of the web's `Pagination`, "Nothing yet." when empty.
  No filter controls on this screen — the web renders `ActivityLogFilters` with `isAdmin={false}` and `forceUserId`, and
  the filter sheet belongs to session 18.
- `src/components/activityLog/ActivityLogItem.tsx` — a readable row for now: actor-less (it is always this user), the
  `action` verb, `entityName`, an entity pill from the copied entity-type meta, and `TimeAgo` on `createdAt`. Keep the
  props `{ row: ActivityLogRow }` so session 18 can swap in the full old→new diff renderer without touching this screen.
- `src/screens/profile/ProfileEditScreen.tsx` — "Back to profile" row, the same read-only identity card at 80dp, then two
  cards:
  - **Profile photo** (`Camera` icon, "JPEG or PNG, up to 5 MB."): a "Change photo" button → "Uploading…" while in
    flight, opening an action sheet with Camera / Choose from gallery / Cancel via `react-native-image-picker`
    (`launchCamera` / `launchImageLibrary`, `mediaType: "photo"`). Enforce `image/jpeg` + `image/png` and 5 MB on device
    with the server's own messages ("Invalid file type (JPEG or PNG only)", "File too large (max 5MB)") before posting.
    `POST /api/auth/profile/avatar` with `FormData` holding one `avatarFile` part as `{ uri, name, type }` and **no**
    manual `Content-Type`. On success: reload the profile, call `refreshUser()` from `AuthContext` so the header avatar
    updates, and toast the server's `message`.
  - **Change password** (`Lock` icon, "Enter your current password, then choose a new one."): `src/components/profile/PasswordField.tsx`
    ported from the web helper — `TextInput` with `secureTextEntry={!show}`, `autoComplete`/`textContentType`
    `current-password` then `new-password` twice, and an `Eye`/`EyeOff` toggle. Current / New / Confirm, then "Update
    password" → "Saving…", plus a Cancel that pops back. Port the three client-side checks and their toasts verbatim
    ("Please fill in all password fields", "New password must be at least 6 characters", "New password and confirmation
    do not match"), then `PATCH /api/auth/profile/password` with `{ oldPassword, newPassword }`. On success: toast the
    server message, clear all three fields, reset the eye toggles, and `navigation.goBack()` to Profile.
- `src/navigation/` — register `Profile` and `ProfileEdit` on the app stack and point the header avatar menu and the
  "More" tab entry at `Profile`, matching the web's Signed-in / Profile / Edit profile menu.

## Already decided (follow these)
- Auth is the JWT from `react-native-keychain` sent as `Authorization: Bearer`; these three routes verify the token
  themselves, so this session is the acceptance test for BACKEND_CHANGES rows 1–2 — confirm them on the dev API first.
- Plain `fetch` + `useState`/`useEffect` through `src/api/client.ts` (`send`, `ApiError`, the global 401 → login with the
  `"auth-401"` toast id). No TanStack Query.
- Dates use `dayjs` only — `toLocaleString` with `dateStyle`/`timeStyle` is unreliable on Hermes without full-icu.
- Avatars go through session 3's `Avatar` + `src/lib/imagekitUrl.ts` (`?tr=w-<n>,h-<n>,f-auto` at 2x), with the lucide
  `User` icon fallback on error.
- Packages already installed: `react-native-image-picker@^8.2`, `lucide-react-native@^1.49`, `dayjs@^1.11`,
  `react-native-toast-message@^2.5`. Add nothing new.
- No role gate anywhere on these two screens — every signed-in user sees their own profile, and the API scopes the
  activity rows to them.
- NativeWind `className` with the web's Tailwind strings; cards, buttons, inputs, pills and skeletons come from
  `src/components/ui/`.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components and
  screens, files under 250 lines.

## Steps
1. Verify the Bearer fallback with curl against the dev API: `GET /api/auth/profile` with the header and no cookie must
   return the profile, and a bad token must return `401 { success:false, message:"Unauthorized" }`. Stop and report if not.
2. Copy `src/types/authProfile.ts`, add the three endpoints, and render `ProfileScreen` with `ProfileCard` +
   `ProfileFacts` only, inside a plain `ScrollView`, to confirm the payload maps.
3. Convert it to the `FlatList` + `ListHeaderComponent` shape and add `MyActivityList` and `ActivityLogItem` with paging.
4. Register both routes and wire the header avatar menu and the "More" entry.
5. Build `ProfileEditScreen` with the identity card and the `PasswordField` form, including the three client-side checks,
   and change a test user's password end to end.
6. Add the photo card: picker sheet, the client-side type and size guards, the multipart POST, then `refreshUser()`.
7. Check `AndroidManifest.xml` has the camera permission the picker needs, and that choosing from the gallery works on a
   device with no camera permission granted.

## Definition of done
- [ ] `npm run android` installs and the header avatar menu opens Profile.
- [ ] The profile card shows the real avatar, name, email, role label and Active pill for the logged-in test user, with
      the three dates rendered as `D MMM YYYY, h:mm A` and `—` where the API sends null.
- [ ] "Created by" appears for a user created by someone and is absent for the seeded admin.
- [ ] "My activity" lists 15 rows and appends the next page on scroll; a user with no history shows "Nothing yet.".
- [ ] Pull-to-refresh reloads the profile and the first activity page.
- [ ] Taking a photo with the camera and picking a JPEG from the gallery both upload, and the new avatar appears on the
      profile screen and in the header without restarting the app.
- [ ] A >5 MB image and a non-JPEG/PNG file are both refused on device with the server's wording, and no request is sent.
- [ ] Submitting an empty, a 5-character, or a mismatched new password each toast the web's exact message.
- [ ] A correct current password updates it, toasts "Password updated successfully", clears the fields and returns to
      Profile; a wrong one toasts "Old password is incorrect" (401) without logging the user out.
- [ ] All three eye toggles reveal and hide their own field only, and the Android keyboard never covers the submit button.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish Profile. If `GET /api/auth/profile` returns 401 with a valid Bearer token, the fallback in that route (and in
`/profile/avatar` and `/profile/password`) is still missing — report it as a backend blocker and do not work around it in
the app. If the avatar upload returns 400 "No image file provided", check the FormData part is named `avatarFile`, carries
a real filename and `type`, and that no `Content-Type` header is set by hand. If a wrong current password logs the user
out, exempt the `/api/auth/profile/password` 401 from the client's global 401 handler. Report what is left.
