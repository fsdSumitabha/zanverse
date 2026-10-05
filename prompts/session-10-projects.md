# Session 10 — Projects module

Projects across all clients: a filterable list, a project workspace with its timeline and status sheet, and a usable edit form.

---

Session 10 — Projects module.

Read docs/OVERVIEW.md §3 (Styling, Data, Navigation, Forms), §4 (packages), §5 (structure), §6 (modules and screens) and §8 (shared code rule).
Read docs/SCREENS.md `/admin/operations/projects`, `/admin/operations/projects/[projectId]`, `/admin/operations/projects/[projectId]/edit`
and `/admin/operations/projects/create` (the retired one), plus its closing notes on role gating and the Tooltip component.
Read docs/API_CONTRACT.md rows for `/api/admin/operations/projects*` and the "response shape inconsistencies" note.
Read docs/COMPONENTS.md rows for `ProjectCard.tsx`, `ServiceBadge.tsx`, `StatusBadge.tsx`, `ProjectCardSkeleton.tsx`, `tooltip/Tooltip.tsx`.

Reference (read-only): D:\zan-workspace —
`src/app/admin/operations/projects/ProjectsClient.tsx`, `src/components/admin/operations/ProjectCard.tsx`,
`src/components/admin/operations/skeletons/ProjectCardSkeleton.tsx`,
`src/app/admin/operations/projects/[projectId]/page.tsx`, `src/components/admin/operations/ProjectDetail.tsx`,
`src/components/admin/operations/statusDropdowns/ProjectStatusDropdown.tsx`,
`src/app/admin/operations/projects/[projectId]/edit/page.tsx`, `src/components/admin/operations/ProjectEditForm.tsx`,
`src/constants/projectStatus.ts`, `src/constants/services.ts`, `src/types/projects.ts`.

## Goal
The Projects tab opens a paged list of every project with status and date filters and in-screen search. Tapping a card
opens the project workspace: title, client row, service badge, budget, status, the full entityType 2 timeline with the
four add-interaction forms, and delete. Edit saves title, description, service type, status, budget and company name
without anyone ever typing a Mongo id.

## Scope
- `src/screens/projects/ProjectsListScreen.tsx` — `useListQuery` + `ListScreen` from session 6 against
  `GET /api/admin/operations/projects?page&limit=10&search&status&from&to`, `PAGE_SIZE` 10, data read from flat
  `json.data` and `json.pagination.pages`. 403 → `AccessDenied` with the server message. No create button on this screen.
- `src/components/projects/ProjectCard.tsx` — client name (primary), client company, project title, `StatusBadge` with
  `PROJECT_STATUS_META`, description clamped to 2 lines (`numberOfLines={2}`), budget on its own row as
  `₹{budget.toLocaleString("en-IN")}` rendered only when `budget` is set, `TimeAgo` on `createdAt`, `ServiceBadge` from
  `SERVICE_META` when `serviceType` is set, and a plain "Created by {createdBy.name}" line replacing the web Tooltip.
  Guard `clientId` — it can be a deleted client: fall back to "Deleted client" / "N/A".
- `src/components/projects/ProjectCardSkeleton.tsx` — the skeleton passed to `ListScreen` as `SkeletonComponent`.
- The filter sheet's status picker renders all 8 `PROJECT_STATUS_META` entries (110 Discussion → 180 Closed) in a
  scrollable `ScrollView` inside the sheet, not a fixed-height menu.
- `src/screens/projects/ProjectDetailScreen.tsx` — `GET /api/admin/operations/projects/:id` (flat `data`, unlike
  leads/clients) plus `GET /api/admin/operations/projects/:id/interactions` (rows arrive at `json.interactions`, top
  level). The timeline kit from session 8 renders the rows at `entityType` 2 and the four forms post with
  `entityType: 2, entityId: projectId`. Refetch the project and the timeline after a status change and after any form
  succeeds. The detail card is the `ListHeaderComponent` of the timeline list.
- `src/components/projects/ProjectDetailCard.tsx` — ported from `ProjectDetail.tsx`: title, a tappable client row
  (`{company} • {name}` → `ClientDetail` with `{ id: project.clientId._id }`) with the `WhatsAppLink` port on
  `clientId.phone`, `ServiceBadge`, description, the Budget Overview block (Estimated `₹{budget}` plus the "Paid" and
  "Due" `₹—` placeholders, 2 columns on phone), `Updated: <TimeAgo date={project.updatedAt} />`, and an Edit button shown
  only for `PROJECT_EDIT_ROLES = [10, 15, 60, 45, 70]`.
- Status change via the status sheet pattern built in sessions 7 and 9: sheet lists the 8 statuses with the current one
  marked, selecting one opens the required-remarks step, Confirm calls
  `PATCH /api/admin/operations/projects/:id/status` with `{ status, remarks }`. Empty remarks toasts "Remarks are
  required" and sends nothing. At status 180 Closed the sheet never opens — render a plain `StatusBadge`.
- Delete: `DELETE /api/admin/operations/projects/:id` behind an `Alert.alert` confirm, gated client-side on
  `[10, 15, 60, 45, 70]` (the web button has no check and 403s), then toast and `navigation.goBack()` to the list.
- `src/screens/projects/ProjectEditScreen.tsx` — seeds from `GET /api/admin/operations/projects/:id`, submits
  `PATCH /api/admin/operations/projects/:id` with `{ clientId, title, description?, serviceType?, status, companyName?, budget? }`,
  `budget` as a Number, `status` as a Number. The Client field is a read-only row showing the loaded project's client
  name and company, with `clientId` held in state and sent unchanged. Title required: empty title toasts
  "Client ID and project title are required" and sends nothing. Service type and status use `@react-native-picker/picker`
  built from `Service` / `SERVICE_META` and `PROJECT_STATUS_META`. Budget uses `keyboardType="numeric"`. Wrap the form in
  `KeyboardAvoidingView`, and on success toast and navigate back to `ProjectDetail` (no 3-second redirect).
- Wire `ProjectsList`, `ProjectDetail` and `ProjectEdit` in `ProjectsStack` over the session 5 placeholders, keeping
  `canOpen("ProjectEdit", role)` = `[10, 45, 60, 70]`.

## Already decided (follow these)
- Do not build a standalone project create screen. `/clients/:id/projects/create` from session 9 is the only creation
  path, and `POST /api/admin/operations/projects` is the only endpoint for it.
- Plain `fetch` + `useState`/`useEffect` through `src/api/client.ts` (`send`/`sendRaw`, `ApiError`, 401 handling). No
  TanStack Query, no Redux.
- NativeWind `className` with the web's Tailwind strings; statuses and services come from `PROJECT_STATUS_META` and
  `SERVICE_META` in the copied `src/constants/`, never from literals.
- Lists are `useListQuery` + `ListScreen` + `ListFilters` from session 6. No numbered pagination.
- Timeline rows, the four interaction forms and the inline remarks/note editing come from session 8 unchanged — this
  session passes `entityType: 2` and the project id, nothing more.
- Packages already installed: `@react-navigation/native@^7`, `@react-native-picker/picker@^2`,
  `@react-native-community/datetimepicker@^9.2`, `lucide-react-native@^1.49`, `dayjs@^1.11`, `clsx@^2`,
  `react-native-toast-message@^2.5`. Add nothing new.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components and
  screens, files under 250 lines.

## Steps
1. Port `ProjectCard` and `ProjectCardSkeleton`, then build `ProjectsListScreen` on `useListQuery` and confirm real rows
   from the dev API.
2. Check the status picker in `ListFilters` scrolls through all 8 values and that filtering resets to page 1.
3. Port `ProjectDetailCard` (header, client row, service, description, budget block, updated stamp, Edit button).
4. Build `ProjectDetailScreen`: fetch project + interactions, mount the session 8 timeline at `entityType` 2, hang the
   detail card as `ListHeaderComponent`.
5. Add the status sheet with the remarks step and the 180 lock, then the role-gated delete via `Alert`.
6. Build `ProjectEditScreen` with the read-only client row and the two pickers, and save a change end to end.
7. Register all three screens in `ProjectsStack` and walk the tab: list → card → status change → timeline entry → edit → back.

## Definition of done
- [ ] `npm run android` installs and the Projects tab opens the list.
- [ ] The first page shows 10 project cards; scrolling appends page 2 and the skeleton footer appears while it loads.
- [ ] Each card shows client name, company, title, status pill, 2-line description, budget row and "Created by …".
- [ ] The filter sheet scrolls through all 8 statuses; picking "In Progress" shows only 150 projects and the count matches `pagination.total`.
- [ ] Tapping a card opens the workspace with the detail card as the header and the timeline below it.
- [ ] A status change with remarks succeeds, and the refetched timeline shows the new 2510 row without leaving the screen.
- [ ] Confirming with empty remarks toasts "Remarks are required" and fires no request.
- [ ] A project at 180 Closed shows a plain status badge and no sheet opens on tap.
- [ ] Adding a note from the workspace writes with `entityType: 2` and appears in the timeline.
- [ ] Tapping the client row opens that client's detail screen.
- [ ] Edit shows the client as a read-only row, saves a new title and budget, and the list and workspace both show the new values.
- [ ] A role outside `[10,15,45,50,60,70]` sees `AccessDenied` with the API's message instead of the list.
- [ ] A role outside `[10,45,60,70]` cannot reach ProjectEdit, and a role outside `[10,15,60,45,70]` sees no Delete button.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish the Projects module. If `budget.toLocaleString("en-IN")` renders as plain digits or throws on the device, write a
small `formatRupees(value)` helper in `src/lib/money.ts` that groups manually and use it everywhere, noting the Hermes
Intl result in the summary. If the session 8 timeline kit needs a prop this module lacks, pass `entityType: 2` plus the
project id and leave the kit itself untouched. If the detail screen is done but edit is not, finish
`ProjectEditScreen.tsx` with the read-only client row, then run the Definition of done list and stop.
