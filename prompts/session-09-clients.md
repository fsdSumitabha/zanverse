# Session 09 — Clients module

The full client workspace on the device: a paged client list, a detail screen with the timeline at entityType 1, edit, the per-client projects list, and creating a project for that client without ever typing an id.

---

Session 09 — Clients module.

Read docs/OVERVIEW.md §3 (Styling, Navigation, Data, Forms), §4 (packages), §5 (structure), §6 (module table), §8 (shared code rule).
Read docs/SCREENS.md `/admin/operations/clients`, `/clients/[clientId]`, `/clients/[clientId]/edit`,
`/clients/[clientId]/projects`, `/clients/[clientId]/projects/create`.
Read docs/API_CONTRACT.md rows for `/api/admin/operations/clients*` and `POST /api/admin/operations/projects`, plus the
"response shape inconsistencies" and "route guards disappear" notes.
Read docs/COMPONENTS.md rows for `ClientCard.tsx`, `ClientDetails.tsx`, `ClientForm.tsx`, `ClientInfoCard.tsx`,
`ClientProjectPreviewCard.tsx`, `button/WhatsAppLink.tsx`, `AccessDenied.tsx`.

Reference (read-only): reference/zan-workspace —
`src/app/admin/operations/clients/ClientsClient.tsx`, `src/app/admin/operations/clients/[clientId]/page.tsx`,
`src/app/admin/operations/clients/[clientId]/edit/page.tsx`, `src/app/admin/operations/clients/[clientId]/projects/page.tsx`,
`src/app/admin/operations/clients/[clientId]/projects/create/page.tsx`,
`src/components/admin/operations/ClientCard.tsx`, `ClientDetails.tsx`, `ClientForm.tsx`, `ClientInfoCard.tsx`,
`ClientProjectPreviewCard.tsx`, `statusDropdowns/ClientStatusDropdown.tsx`,
and the API routes `src/app/api/admin/operations/clients/[id]/{route,status,interactions,projects}.ts` for the exact
role arrays and messages.

## Goal
Five working screens under a Clients tab: list with filters and infinite scroll, a client workspace that reuses the
session 8 timeline at entityType 1 plus the status sheet, an edit form, the client's projects list, and a
create-project form that already knows the client. At the end a user can open a client, move its status with remarks,
add a note or call, and create a project for it on the device.

## Scope
- `src/screens/clients/ClientsListScreen.tsx` — `ListScreen` + `useListQuery` over
  `GET /api/admin/operations/clients?page&limit=10&search&status&from&to`, `ListFilters statusMeta={CLIENT_STATUS_META}`.
  No create button, no FAB (clients come from lead convert).
- `src/components/clients/ClientCard.tsx` — name, company, `StatusPill` from `CLIENT_STATUS_META`, phone through
  `PhoneText`, email, `TimeAgo` on `createdAt`, and `Created by {createdBy.name}` as visible text in place of the web Tooltip.
- `src/screens/clients/ClientDetailScreen.tsx` — `GET /api/admin/operations/clients/:id` returns the nested
  `{ client, lead, projects }`; `GET /api/admin/operations/clients/:id/interactions` returns `interactions` at the TOP level.
  Segmented tabs Overview / Timeline / Projects so the header + timeline + projects are not one endless scroll.
  - Overview: `ClientHeaderCard` (name, company, Edit for roles [10, 15, 60, 69, 45, 70], email, `WhatsAppLink` on phone,
    company row, Joined/Updated `TimeAgo`), then the Converted-from-Lead block when `lead` is non-null — the web's
    4-column `<dl>` becomes a label/value column (Source, Lead status pill from `LEAD_STATUS_META`, Captured
    `lead.createdAt`, Converted `client.createdAt`) with a "View lead" row that navigates to the lead detail screen.
  - Status: the session 7 status sheet + `StatusContext` with the required-remarks step, built from `CLIENT_STATUS_META`
    (1 Active, 2 Inactive, 3 On Hold, 4 Completed). At status 4 the pill is read-only — the server answers
    "Cannot update a completed client". `PATCH /api/admin/operations/clients/:id/status` body `{ status, remarks }`,
    then refetch BOTH the client and the interactions (the web forgets the second call, so its 2510 row only appears
    after a manual reload).
  - Timeline tab: the session 8 timeline kit with `entityType={1}` and the four add-interaction forms, same components
    as the lead detail screen.
  - Projects tab: `projects.slice(0, 3)` through `ClientProjectPreviewCard`, a "View All" row to `ClientProjectsScreen`,
    "No projects yet" when empty.
  - One FAB only — "Create New Project" — offset by `useBottomTabBarHeight() + insets.bottom`; it replaces the web's
    duplicate button + FAB pair.
  - Delete behind an `Alert` confirm, shown only for roles [10, 15, 45] (`DELETE /api/admin/operations/clients/:id`
    then navigate back to the list). The web shows this button to everyone and lets the API 403 — add the missing gate.
- `src/screens/clients/ClientEditScreen.tsx` + `src/components/clients/ClientForm.tsx` — name*, company*, phone*, email;
  seed from `data.client`, submit `PATCH /api/admin/operations/clients/:id` with `{ name, company, email, phone }`.
  Reuse `useEditablePhone` + `PhoneField` from session 7; a `{ field: "phone" }` response sets the inline phone error.
  The form keeps the create branch (`POST /clients` with `region`) behind a `mode` prop, with no screen wired to it.
- `src/components/clients/ClientProjectPreviewCard.tsx` — title (navigates to the project detail route registered in
  session 10), `companyName`, description `numberOfLines={2}`, status pill from `PROJECT_STATUS_META`, and the three
  meta pills: service from `SERVICE_META`, `budget.toLocaleString("en-IN")`, `TimeAgo` on `createdAt`.
- `src/screens/clients/ClientProjectsScreen.tsx` — `GET /api/admin/operations/clients/:id/projects` returns the complete
  array, so render a plain `FlatList` over it with pull-to-refresh and drop the web's client-side slice-by-5 and its
  prev/next bar. Skeleton cards while loading, `EmptyState` when empty.
- `src/screens/clients/ProjectCreateScreen.tsx` — a read-only client card (name, company, status pill, email, phone,
  created-at) built from the client already loaded in the route params, falling back to `GET /clients/:id`, so no id is
  ever typed. Fields: title*, description (multiline), serviceType from `Service`/`SERVICE_META`, status from
  `PROJECT_STATUS` defaulting to `PROJECT_STATUS.DISCUSSION`, budget with `keyboardType="numeric"`.
  `POST /api/admin/operations/projects` with `{ clientId, title, description, serviceType, status, budget: Number(budget) }`
  — no region field, the project inherits the client's. On success toast and navigate straight to the new project,
  replacing the web's 3-second `setTimeout`.
- `src/navigation/` — a Clients stack (list → detail → edit → projects → project create) mounted as a tab, hidden for
  role 65 the way the web sidebar hides it, and the two proxy gates re-implemented client-side: edit [10, 45, 60, 69, 70],
  projects/create [10, 45, 60, 70]. The API 403 still renders `AccessDenied` with the server message.

## Already decided (follow these)
- NativeWind `className` with the web's Tailwind strings; `CLIENT_STATUS_META`, `PROJECT_STATUS_META` and `SERVICE_META`
  are copied constants and supply every colour and label.
- Data is plain `fetch` through `src/api/client.ts` + `useListQuery` from session 6. No TanStack Query, no Redux.
- Primitives come from `src/components/ui/` (session 3) and the list kit from session 6; the status sheet comes from
  session 7 and the timeline kit from session 8. Add no new package this session.
- `dayjs@^1.11` for `TimeAgo`, `@react-native-picker/picker@^2` for the serviceType and status selects,
  `libphonenumber-js@^1.13` behind `lib/phone.ts`, `lucide-react-native@^1.49` icons, `react-native-toast-message@^2.5` toasts.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export per component and
  screen, files under 250 lines.
- API roles, messages and status codes stay exactly as the web's routes return them: list/detail GET
  [10, 15, 50, 60, 69, 70, 45], PATCH client [10, 15, 60, 69, 70, 45], PATCH status [10, 15, 50, 60, 69, 45, 70],
  DELETE [10, 15, 45], POST project [10, 15, 45, 50, 60, 70].

## Steps
1. `ClientCard` + `ClientsListScreen` against the dev API; confirm 10 rows and a second page on scroll.
2. Register the Clients stack and tab, with the role gates on the edit and project-create routes.
3. `ClientDetailScreen` fetches: client + interactions, loading skeletons, "Client not found" empty state, `AccessDenied` on 403.
4. `ClientHeaderCard` and the Converted-from-Lead block; wire the status sheet and the double refetch, then check the lock at status 4.
5. Drop in the session 8 timeline with `entityType={1}` and the four interaction forms; add one note and confirm the row appears.
6. The Projects tab, `ClientProjectPreviewCard`, the "View All" route and `ClientProjectsScreen`.
7. `ClientForm` + `ClientEditScreen`, including a server phone error landing on the phone field.
8. `ProjectCreateScreen` with the read-only client card and the two pickers; create a real project and land on it.
9. Delete: Alert confirm for a role in [10, 15, 45], and the button absent for everyone else.

## Definition of done
- [ ] `npm run android` installs and the Clients tab opens.
- [ ] The list shows 10 clients, appends the next page on scroll, and a status + date-range filter resets to page 1.
- [ ] Opening a client shows the header, the Converted-from-Lead block for a converted client (and nothing for a direct one), and the timeline.
- [ ] Changing status asks for remarks, rejects an empty remarks box, and after saving both the new pill and the new 2510 timeline row are visible without a manual reload.
- [ ] A client at status 4 Completed cannot be moved, and the server's "Cannot update a completed client" never has to fire.
- [ ] Adding a note from the client detail screen appends a row to the timeline at entityType 1.
- [ ] The Projects tab shows at most 3 cards; "View All" lists every project for that client in one scrolling list.
- [ ] Editing name, company, email and phone saves, and a duplicate/invalid phone shows the server message under the phone field.
- [ ] Creating a project from the FAB posts without a client id being typed and navigates to the new project immediately.
- [ ] A role outside [10, 15, 45] sees no Delete button; a role in it deletes after the Alert and lands on the client list.
- [ ] A 403 on any client screen renders `AccessDenied` with the API's message; a 401 lands on Login.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish the clients module. If the project detail route from session 10 does not exist yet, point `ClientProjectPreviewCard`
and the post-create navigation at a placeholder screen and note it. If the detail screen's segmented tabs fight the
timeline's `FlatList`, keep one `FlatList` and pass the header card, the lead block and the projects section as
`ListHeaderComponent`/`ListFooterComponent` instead of nesting scroll views. If `@react-native-picker/picker` looks
wrong on Android for serviceType or status, reuse the session 6 filter sheet as a select sheet behind the same
`value`/`onChange` props.
