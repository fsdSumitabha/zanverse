# Web app screens (source for the mobile screens)

> Generated from the Next.js app at commit 6858fb8. One section per web screen: what it does, which endpoints it calls, its state, role gates, and what has to change on a phone.

| Route | Size | Purpose |
|---|---|---|
| `/admin/operations/* (shell — not a screen, wraps every operations route)` | L | Persistent chrome for every operations screen: desktop sidebar nav, mobile top bar + bottom tab bar, global search field in the header, right-hand aside with StatsPanel and UpcomingMeetingsPanel, notification bell, region switcher, logout |
| `/admin/operations` | S | Dashboard activity feed |
| `/admin/operations/leads` | M | Paged, filterable list of leads |
| `/admin/operations/leads/create` | S | Create a lead: name, email, phone (with region-aware phone field + server-side validation feedback), source, and — on create only — the region the lead is saved in |
| `/admin/operations/leads/[leadId]` | L | The main working screen of the CRM |
| `/admin/operations/leads/[leadId]/edit` | S | Edit a lead's name, email, phone and source |
| `/admin/operations/leads/[leadId]/convert` | S | Convert a lead in status 50 (Negotiation) into a Client |
| `/admin/operations/clients` | M | Paged, filterable list of clients — status + date-range filters and one card per client (name, company, email, phone, status badge, created-at, created-by tooltip). |
| `/admin/operations/clients/[clientId]` | L | Client workspace: header card with status dropdown + required-remarks confirm and an Edit link, a 'Converted from Lead' block linking back to the originating lead, the same four add-interaction actions and full timeline (entityType 1), a Delete Client button, a 'Projects' section showing the first 3 projects with a 'View All' link, a 'Create New Project' button and a + FAB. |
| `/admin/operations/clients/[clientId]/edit` | S | Edit a client's name, company, email and phone |
| `/admin/operations/clients/[clientId]/projects` | S | All projects belonging to one client, 5 per page, with a 'Create New Project' button. |
| `/admin/operations/clients/[clientId]/projects/create` | M | Create a project for a known client |
| `/admin/operations/projects` | M | Paged, filterable list of all projects across clients — status + date-range filters, one card per project showing title, description, service badge, status, budget, the client (name + company) and created-by. |
| `/admin/operations/projects/[projectId]` | L | Project workspace: detail card (title, client link, service badge, budget, status dropdown with required remarks, Edit link), the same four add-interaction actions and full timeline (entityType 2), and a Delete Project button. |
| `/admin/operations/projects/[projectId]/edit` | M | Edit a project: client id, company name, title, description, service type, status and budget |
| `/admin/operations/projects/create` | S | Standalone 'create project for an existing client' form — the same fields as the per-client version, but the client has to be identified by pasting a raw Client ID. |
| `/ (root shell, not a visible screen)` | medium | Next.js root layout: fonts, globals.css, sonner <Toaster position="top-center" theme="dark" richColors>, AuthProvider -> RegionProvider -> ImageKitProvider, and SWRegister (registers /sw.js for PWA) |
| `/ (landing page)` | low | Static splash: ZAN logo (light/dark variants), title "Zan Workspace", one-line subtitle, and a single "Go to dashboard" link to /admin/operations |
| `/admin/operations/* (operations layout shell)` | high | The chrome every operations screen sits inside: desktop sidebar (hidden md:block), fixed mobile top bar + 14px spacer, a header row holding SearchBar (8 cols) and NotificationBell (desktop only, 4 cols), a 3-column body where children take lg:col-span-2 and a sticky right aside holds StatsPanel + UpcomingMeetingsPanel, and a fixed mobile bottom nav. |
| `/admin/operations/meetings` | high | Paginated list of all meetings with filters (status, entity type, temporal quick-range) and inline actions on each card: reschedule, cancel, mark completed with an outcome note. |
| `/admin/operations/notifications` | medium | Full notification inbox: All / Unread toggle, cursor-paginated list, per-row mark-read (and navigate to row.url), mark-all-read, plus a note that rows older than 30 days are auto-removed |
| `/admin/operations/profile` | medium | Read-only view of the signed-in user's own account: avatar, name, email, role label, active/inactive pill, member-since / last-login / last-updated dates, who created the account, plus an embedded 'My activity' section (the same activity-log filters + list, locked to this user). |
| `/admin/operations/profile/edit` | medium | Self-service profile edits - only two things: change the avatar photo (hidden file input + 'Change photo' button, JPEG/PNG up to 5 MB) and change the password (current / new / confirm, each with an eye toggle) |
| `/admin/operations/users` | medium | Paginated staff directory (5 per page) with search, a UserCard per row showing avatar/name/email/role/active pill/regions/created+lastLogin, a pencil edit affordance pinned bottom-right of each card, a top 'Create New User' button and a fixed floating + FAB. |
| `/admin/operations/users/create` | high | Thin wrapper around the shared UserForm: builds multipart FormData (name, email, password, role, one `regions` entry per selected region, isActive, optional avatarFile), POSTs it, shows a loading->success/error toast chain, then pushes back to the users list. |
| `/admin/operations/users/[userId]/edit` | high | Same UserForm in mode='edit', pre-filled from the loaded user, but the submit handler does a diff: it appends only the fields that actually changed (name, email, role, isActive, regions as a sorted-join comparison, password only when non-blank, avatarFile or removeAvatar=true) and shows 'Nothing changed yet' when the FormData ends up empty. |
| `/admin/operations/activity-logs` | high | Admin-only system audit feed: header, a filter card (entity type, user picker, from/to dates, free-text q) and a paginated list of ActivityLogItem rows |
| `/admin/operations/overall-stats` | high | 'Pipeline overview' dashboard: a 4-up KPI row, then a 2x2 grid of pie/doughnut cards (lead statuses, client statuses, project statuses, meeting statuses) each with its own colour palette and legend, running-project budget and user-role counts, a 'leads over time' card with a year drill-down into monthly bars, and a TimeAgo 'updated' stamp. |
| `/admin/authentication/login` | low | Email + password sign-in card: title, optional inline error block, email input, password input with an eye/eye-off toggle, submit button that reads 'Signing in...' while busy, and a footer line. |
| `/admin/authentication/unauthorized` | low | Static 'Access Denied' page: shield icon, two explanatory lines, and two buttons - 'Go to Home' (/) and 'Back to Admin' (/admin/operations) |
| `/book (PUBLIC - prospect-facing, not staff)` | high | Public Calendly-style booking funnel for prospects on the Zan Services website |

---

## `/admin/operations/* (shell — not a screen, wraps every operations route)`

**Purpose.** Persistent chrome for every operations screen: desktop sidebar nav, mobile top bar + bottom tab bar, global search field in the header, right-hand aside with StatsPanel and UpcomingMeetingsPanel, notification bell, region switcher, logout. Holds the auth session (useAuth) that every role gate in the app reads.

**Web files:** `src/app/admin/operations/layout.tsx`, `src/components/admin/operations/SideBar.tsx`, `src/components/admin/operations/MobileNav.tsx`, `src/components/admin/operations/MobileTopBar.tsx`, `src/components/admin/operations/SearchBar.tsx`, `src/components/admin/operations/StatsPanel.tsx`, `src/components/admin/operations/UpcomingMeetingsPanel.tsx`, `src/components/admin/operations/NotificationBell.tsx`, `src/components/admin/operations/region/RegionSwitcher.tsx`, `src/contexts/AuthContext.tsx`, `src/contexts/RegionContext.tsx`, `src/proxy.ts`

**API calls**
- GET /api/auth/me — AuthProvider on mount; returns { id, name, email, role, regions, activeRegion, avatar }. Every role gate in the app depends on it
- POST /api/auth/logout — sidebar hover 'Logout' / mobile profile menu
- POST /api/auth/region — RegionSwitcher when the active region changes; on success it calls window.location.reload() to drop every list fetched under the old scope
- GET /api/admin/operations/stats — StatsPanel on mount and on every pathname change (4 counters: leads, activeClients, projectsRunning, meetingsThisWeek)
- GET /api/admin/operations/meetings?range=upcoming&limit=20 — UpcomingMeetingsPanel on mount and on every pathname change; re-sorted client-side soonest-first, sliced to 4
- GET /api/admin/operations/search?search=<q> — SearchBar, dashboard mode only, debounced 300ms, min 2 chars; returns { leads, clients, projects, meetings }
- GET /api/notifications?limit=4 — NotificationBell on mount and on a polling interval
- PATCH /api/notifications/seen — when the bell dropdown is opened and unseen > 0
- PATCH /api/notifications/:id/read — tapping one notification row
- PATCH /api/notifications/read-all — 'mark all read' in the bell dropdown

**State.** No list state of its own. SearchBar owns the `search` URL param on entity list routes (debounced 300ms write, also deletes `page`); in dashboard mode it keeps a local query + results + activeIndex and writes nothing to the URL. Region lives in a server cookie via RegionContext, with a local `override`. Nav active-item derived from usePathname().

**Roles.** proxy.ts redirects any /admin/* request without a valid auth_token cookie to /admin/authentication/login, and to /admin/authentication/unauthorized if the JWT role is not in the matched routePermissions entry. No proxy rule covers /admin/operations, /leads, /clients or /projects list routes — those gates are enforced only by the API returning 403. Sidebar/MobileNav filter nav items by role: Dashboard/Leads/Meetings [10,15,20,30,40,42,45,50,60,65,69,70,80]; Clients same minus 65; Projects same minus 65,69; Lead Sources LEAD_SOURCE_ACCESS_ROLES [10,15,45,69,50,60,65,70]; Users sidebar [10,20,45,69] / mobile [10,15,20,69]; Activity Log [10,20]. Sidebar and MobileNav both render null while auth is loading or user is null.

**Components.** Sidebar, OperationsMobileTopBar, OperationsMobileNav, SearchBar, SearchResults, StatsPanel, UpcomingMeetingsPanel, NotificationBell, RegionSwitcher, RegionFlag, AuthProvider, RegionProvider

**On a phone.** The web layout already has a phone path (hidden md:block sidebar, fixed top bar, bottom nav), so the IA maps cleanly: RN bottom Tab.Navigator = MobileNav's 6 filtered items, header = MobileTopBar (logo, region flag, bell, profile sheet, overflow menu). What must change: (1) the lg:grid-cols-3 content+aside split is desktop-only — on RN, StatsPanel and UpcomingMeetingsPanel belong on the Dashboard tab itself (or a collapsible header), not beside every screen; (2) SearchBar is a layout-level header input whose behaviour forks by route — in RN split it into a per-list search field and a separate global-search screen; its ArrowUp/ArrowDown/Enter result navigation and the mousedown-outside-to-close handler have no touch equivalent; (3) notification bell dropdown → bottom sheet or its own screen; (4) the region switch currently does window.location.reload() — RN needs an explicit cache invalidation / refetch of every active query instead; (5) MobileNav's scroll-direction hide/show and the CSS-module floating indicator need re-implementation with Reanimated; (6) cookie auth (auth_token, region cookie) must become a token store — the API already accepts Authorization: Bearer per the port plan.

**Size.** L

---

## `/admin/operations`

**Purpose.** Dashboard activity feed. One flat list of every Lead, Client and Project that has a lastInteractionAt, each card showing name/company, phone, email, source, time-ago and its newest timeline row; tapping a card opens that entity's detail screen.

**Web files:** `src/app/admin/operations/page.tsx`, `src/components/admin/operations/EntityCard.tsx`, `src/components/admin/operations/InteractionCard.tsx`, `src/components/admin/operations/StatusChangeItem.tsx`, `src/components/admin/operations/skeletons/EntityCardSkeleton.tsx`, `src/components/admin/operations/AccessDenied.tsx`, `src/lib/auth/handleAuthError.ts`

**API calls**
- GET /api/admin/operations — once on mount (cache: no-store). Returns a normalized array of leads + clients + projects, each with entityType (0/1/2) and an embedded lastInteraction

**State.** None. No pagination, no filters, no sort control, nothing in the URL. The endpoint takes no query params and returns every matching row in one payload.

**Roles.** API requireRole [10,15,60,69,70,45,50]; 403 → AccessDenied with hideAction, 401 → toast + redirect to login (handleAuthError). No proxy rule.

**Components.** EntityCard, InteractionCard, StatusChangeItem, TimeAgo, PhoneText, EntityCardSkeleton, AccessDenied

**On a phone.** Biggest risk is payload size: the route fetches every lead, client and project with lastInteractionAt in one unpaginated response and renders them all — fine on desktop, not on a phone. Needs FlatList virtualization plus (ideally) server paging or at least a limit. The card is already a vertical stack, so it ports well, but the hover affordances (group-hover icon tint, hover:shadow) must become pressed states, and the `w-[90%] mx-auto` wrapper should be full-bleed with 16px gutters. Add pull-to-refresh — there is no refresh control today, only location.reload() in the error state.

**Size.** S

---

## `/admin/operations/leads`

**Purpose.** Paged, filterable list of leads. Status + date-range filters, result count, a card per lead (name, company, status badge, phone, email, source, time-ago, inline 'Convert To Client' when status is 50 Negotiation), prev/next pagination, plus a 'Create New Lead' button and a floating + FAB.

**Web files:** `src/app/admin/operations/leads/page.tsx`, `src/app/admin/operations/leads/LeadsClient.tsx`, `src/components/admin/operations/LeadCard.tsx`, `src/components/admin/operations/ListFilters.tsx`, `src/components/admin/operations/filters/DateField.tsx`, `src/components/admin/operations/Pagination.tsx`, `src/components/admin/operations/CreateActionButton.tsx`, `src/components/admin/operations/ConvertClientButton.tsx`, `src/hooks/usePagination.ts`, `src/hooks/useSearch.ts`

**API calls**
- GET /api/admin/operations/leads?page&limit=10&search&status&from&to — on mount and whenever page, search, status, from or to changes (useCallback dependency); returns { data, pagination: { page, limit, total, pages } }

**State.** All list state lives in the URL: `page` (usePagination, removed when 1, router.push), `search` (written by the layout SearchBar, read by useSearch), `status`, `from`, `to` (ListFilters, router.replace, and every filter change deletes `page`). PAGE_SIZE is a hard-coded 10. No sort control. Local state is only leads/loading/total/totalPages/accessError.

**Roles.** GET /api/admin/operations/leads requireRole [10,15,50,60,65,69,70,45]; 403 → AccessDenied. The list route itself has no proxy rule, but /admin/operations/leads/create is proxy-gated to [10,15,45,50,60,69,70] — the Create button and FAB are rendered for everyone, so a non-matching role taps through to an unauthorized redirect.

**Components.** LeadCard, ListFilters, DateField, Pagination, CreateActionButton, ConvertButton, StatusBadge, TimeAgo, PhoneText, Tooltip, LeadCardSkeleton

**On a phone.** Cards already, not a table, so the row layout survives. Changes needed: (1) prev/next Pagination → FlatList onEndReached infinite scroll (keep the API's page/limit); (2) ListFilters' 4-column grid of a native <select> plus two <input type=date> must become a filter bottom sheet with a picker + a date-range picker — ListFilters also clamps dates to [2026-01-01, today] client-side, keep that; (3) search is in the layout header on web — in RN put it in this screen's header; (4) the 'Convert To Client' button is absolutely positioned over the card at top-1/2 right-0, which will collide with text at phone width — move it to its own row or a swipe action; (5) the fixed bottom-right FAB overlaps the RN bottom tab bar — offset it; (6) the Tooltip showing 'Created by …' is mouseenter/mousemove-only and is simply invisible on touch — surface it as a line of text instead.

**Size.** M

---

## `/admin/operations/leads/create`

**Purpose.** Create a lead: name, email, phone (with region-aware phone field + server-side validation feedback), source, and — on create only — the region the lead is saved in. Redirects to the new lead's detail screen.

**Web files:** `src/app/admin/operations/leads/create/page.tsx`, `src/components/admin/operations/LeadForm.tsx`, `src/components/phone/PhoneField.tsx`, `src/components/phone/useEditablePhone.ts`, `src/components/admin/operations/region/WriteRegionField.tsx`

**API calls**
- POST /api/admin/operations/leads — on submit, body { name, email, source, phone, region? }; a response with field === 'phone' sets the inline phone error instead of throwing

**State.** Local form state only (form, phone hook, region hook, loading). Nothing in the URL.

**Roles.** proxy.ts: /admin/operations/leads/create → roles [10,15,45,50,60,69,70]; others redirect to /admin/authentication/unauthorized. API POST requireRole [10,15,50,60,69,70,45].

**Components.** LeadForm, PhoneField, PhoneHint, WriteRegionField, RegionFlag

**On a phone.** Short form, ports easily. Needs KeyboardAvoidingView + keyboardType='phone-pad'/'email-address', and the phone country/region control should be a native picker. WriteRegionField currently layers an SVG flag over a native <select> — rebuild as a proper RN picker. Replace sonner toasts with an RN toast/snackbar. The proxy-level role redirect has no RN equivalent: gate the route in the navigator from useAuth().role.

**Size.** S

---

## `/admin/operations/leads/[leadId]`

**Purpose.** The main working screen of the CRM. Lead header card with status dropdown + inline remarks confirm, Edit link, 'Convert To Client' when status is 50, a 'Converted to Client' summary block once converted, a row of four add-interaction buttons (Call / Meeting / Note / Quotation) that open an inline form, the full interaction timeline with per-row detail renderers and inline editing of notes and status remarks, and a Delete Lead button for Admin only.

**Web files:** `src/app/admin/operations/leads/[leadId]/page.tsx`, `src/components/admin/operations/LeadDetails.tsx`, `src/components/admin/operations/statusDropdowns/LeadStatusDropdown.tsx`, `src/components/admin/operations/LeadInteractionActions.tsx`, `src/components/admin/operations/InteractionModal/InteractionInlineForm.tsx`, `src/components/admin/operations/InteractionModal/CallForm.tsx`, `src/components/admin/operations/InteractionModal/MeetingForm.tsx`, `src/components/admin/operations/InteractionModal/NoteForm.tsx`, `src/components/admin/operations/InteractionModal/QuotationForm.tsx`, `src/components/admin/operations/interactions/InteractionTimeline.tsx`, `src/components/admin/operations/interactions/InteractionItem.tsx`, `src/components/admin/operations/interactions/InteractionEditor.tsx`, `src/components/admin/operations/interactions/types/NoteItem.tsx`, `src/components/admin/operations/interactions/types/CallItem.tsx`, `src/components/admin/operations/interactions/types/MeetingItem.tsx`, `src/components/admin/operations/interactions/types/QuotationItem.tsx`, `src/components/admin/operations/interactions/types/StatusChangeItem.tsx`, `src/components/admin/operations/dropzone/FileUpload.tsx`

**API calls**
- GET /api/admin/operations/leads/:id — on mount, and again after every successful status change; returns { data: { lead, client } }
- GET /api/admin/operations/leads/:id/interactions — on mount, after a status change, and after any interaction form succeeds
- PATCH /api/admin/operations/leads/:id/status — confirming a status change (body { status, remarks }, remarks required client-side)
- DELETE /api/admin/operations/leads/:id — Delete Lead, confirmed through a sonner toast action button
- POST /api/admin/operations/notes — NoteForm submit (JSON { entityType, entityId, type, title, description })
- POST /api/admin/operations/calls — CallForm submit (multipart FormData incl. optional `recording` file)
- POST /api/admin/operations/meetings — MeetingForm submit (JSON incl. attendees[], scheduledAt, meetingType, status)
- GET /api/admin/operations/users/picker — MeetingForm on mount, to populate the attendee checkbox list
- POST /api/admin/operations/quotations — QuotationForm submit (multipart FormData incl. optional `file`)
- PATCH /api/admin/operations/interactions/:id — InteractionEditor saving an edited note or status remark

**State.** No URL state. Local: lead, client, interactions, loading flags, activeType (which interaction form is open), isOpen, pendingStatus + remarks inside LeadDetails, deleting. The timeline is refetched wholesale after every write — no optimistic update, no cache.

**Roles.** API: GET requireRole [10,15,50,60,65,69,70,45]; PATCH status requireRole [10,15,50,60,65,69,45,70]; DELETE requireRole [10,15,45]. UI: the Delete Lead button is shown only when useAuth().role === 10; LeadDetails shows the Edit link only for LEAD_EDIT_ROLES [10,15,60,69,45,70]; NoteItem/StatusChangeItem show the inline pencil only for INTERACTION_EDIT_ROLES [10,15,60,69,45,50,70]. Note the UI DELETE gate (role 10) is narrower than the API's [10,15,45]. /leads/:id/edit and /leads/:id/convert are proxy-gated to [10,45,60,69,70].

**Components.** LeadDetails, LeadStatusDropdown, ConvertButton, WhatsAppLink, InteractionInlineForm (CallForm, MeetingForm, NoteForm, QuotationForm), LeadInteractionActions, InteractionTimeline, InteractionItem, NoteItem, CallItem, MeetingItem, QuotationItem, StatusChangeItem, InteractionEditor, EditHistory, FileUpload, Tooltip, TimeAgo, LeadDetailsSkeleton, InteractionItemSkeleton, ActionTypeSkeleton

**On a phone.** The heaviest screen to port. (1) The status dropdown is an absolutely-positioned 48-unit popover — make it an ActionSheet/bottom sheet, and keep the 'remarks required' confirm step as a second sheet step. (2) The four interaction forms render inline above the timeline; on a phone they should each be a full-screen modal or bottom sheet — MeetingForm in particular has title, agenda, description, datetime, type, status and a searchable attendee checkbox list, which is a screen of its own. (3) File inputs: QuotationForm uses react-dropzone and CallForm takes a recording file — both need react-native-document-picker / image-picker and multipart upload; drag-and-drop is meaningless on touch. (4) datetime-local inputs → native date/time pickers. (5) The 'Converted to Client' block is a 4-column <dl> (grid-cols-2 sm:grid-cols-4) — collapse to 2 columns or a label/value list. (6) The timeline's left vertical rule + nested cards must be rebuilt with absolute-positioned views; the quotation Download link and meeting-link button should use Linking.openURL. (7) Edit affordances only appear on hover/`group-hover` — give them permanent touch targets ≥44px. (8) The delete confirmation currently lives inside a toast action button — use a native Alert. (9) Timeline should be a FlatList; the header card becomes ListHeaderComponent.

**Size.** L

---

## `/admin/operations/leads/[leadId]/edit`

**Purpose.** Edit a lead's name, email, phone and source. Loads the lead, then reuses LeadForm in mode='edit' (the region field is create-only and is not shown).

**Web files:** `src/app/admin/operations/leads/[leadId]/edit/page.tsx`, `src/components/admin/operations/LeadForm.tsx`

**API calls**
- GET /api/admin/operations/leads/:id — on mount, to seed the form from data.data.lead
- PATCH /api/admin/operations/leads/:id — on submit; a response with field === 'phone' sets the inline phone error

**State.** Local only (loading, lead, form state inside LeadForm).

**Roles.** proxy.ts: /admin/operations/leads/<24-hex>/edit → [10,45,60,69,70]. API PATCH requireRole [10,15,50,60,69,70,45]. Entry point (the Edit link in LeadDetails) is gated on [10,15,60,69,45,70] — the three lists do not agree, so 15 and 50 can reach states the proxy or API will reject.

**Components.** LeadForm, PhoneField, PhoneHint

**On a phone.** Same as the create form: KeyboardAvoidingView, numeric/email keyboards, native toast. The loading and not-found states are plain bordered divs — give them a proper skeleton/empty state. Gate the route in the navigator since there is no proxy.

**Size.** S

---

## `/admin/operations/leads/[leadId]/convert`

**Purpose.** Convert a lead in status 50 (Negotiation) into a Client. Shows a read-only lead info card and a single required Company field; on success waits 2s then navigates to the new client's detail screen.

**Web files:** `src/app/admin/operations/leads/[leadId]/convert/page.tsx`, `src/components/admin/operations/LeadInfoCard.tsx`

**API calls**
- GET /api/admin/operations/leads/:id — on mount, to render LeadInfoCard
- POST /api/admin/operations/leads/:id/convert — on submit, body { company }; response gives data.clientId

**State.** Local only (lead, company, loading, submitting). Nothing in the URL.

**Roles.** proxy.ts: /admin/operations/leads/<24-hex>/convert → [10,45,60,69,70]. API requireRole [10,15,50,60,69,70,45]. The entry button (ConvertButton) renders purely on status === 50, with no role check, from both LeadCard and LeadDetails.

**Components.** LeadInfoCard, PhoneText

**On a phone.** Trivially portable — one read-only card and one text field. Drop the `p-6 max-w-3xl mx-auto` centering for a full-width phone layout. Replace the setTimeout(…, 2000)-then-redirect with navigating immediately and showing a toast. Note this screen does not verify the lead is still in status 50 — only the API does.

**Size.** S

---

## `/admin/operations/clients`

**Purpose.** Paged, filterable list of clients — status + date-range filters and one card per client (name, company, email, phone, status badge, created-at, created-by tooltip).

**Web files:** `src/app/admin/operations/clients/page.tsx`, `src/app/admin/operations/clients/ClientsClient.tsx`, `src/components/admin/operations/ClientCard.tsx`, `src/components/admin/operations/ListFilters.tsx`, `src/components/admin/operations/Pagination.tsx`, `src/hooks/usePagination.ts`, `src/hooks/useSearch.ts`

**API calls**
- GET /api/admin/operations/clients?page&limit=10&search&status&from&to — on mount and whenever page, search, status, from or to changes

**State.** Identical to the leads list: `page`, `search`, `status`, `from`, `to` all in the URL; PAGE_SIZE 10; no sort. Unlike the leads list it does not keep a `total` count and renders no result-count line, and it has no create button or FAB (clients are created by converting a lead, or by POST /clients which has no UI entry point here).

**Roles.** API GET requireRole [10,15,50,60,69,70,45]; 403 → AccessDenied. No proxy rule on the list route. The sidebar hides Clients for role 65.

**Components.** ClientCard, ListFilters, DateField, Pagination, StatusBadge, TimeAgo, PhoneText, Tooltip, ClientCardSkeleton, AccessDenied

**On a phone.** Same treatment as the leads list: infinite-scroll FlatList instead of prev/next, filters into a bottom sheet, search moved out of the global header, hover states → pressed states, created-by Tooltip replaced with visible text. Lighter than leads (no convert button, no FAB).

**Size.** M

---

## `/admin/operations/clients/[clientId]`

**Purpose.** Client workspace: header card with status dropdown + required-remarks confirm and an Edit link, a 'Converted from Lead' block linking back to the originating lead, the same four add-interaction actions and full timeline (entityType 1), a Delete Client button, a 'Projects' section showing the first 3 projects with a 'View All' link, a 'Create New Project' button and a + FAB.

**Web files:** `src/app/admin/operations/clients/[clientId]/page.tsx`, `src/components/admin/operations/ClientDetails.tsx`, `src/components/admin/operations/statusDropdowns/ClientStatusDropdown.tsx`, `src/components/admin/operations/ClientProjectPreviewCard.tsx`, `src/components/admin/operations/LeadInteractionActions.tsx`, `src/components/admin/operations/InteractionModal/InteractionInlineForm.tsx`, `src/components/admin/operations/interactions/InteractionTimeline.tsx`, `src/components/admin/operations/CreateActionButton.tsx`

**API calls**
- GET /api/admin/operations/clients/:id — on mount and again after every status change; returns { data: { client, lead, projects } }
- GET /api/admin/operations/clients/:id/interactions — on mount and after any interaction form succeeds
- PATCH /api/admin/operations/clients/:id/status — confirming a status change (body { status, remarks })
- DELETE /api/admin/operations/clients/:id — Delete Client, confirmed via a toast action
- POST /api/admin/operations/notes | /calls | /meetings | /quotations — the four interaction forms, with entityType 1
- GET /api/admin/operations/users/picker — MeetingForm attendee list
- PATCH /api/admin/operations/interactions/:id — inline note / status-remark editing

**State.** No URL state. Local: client, lead, projects, interactions, activeType, isOpen, deleting, pendingStatus + remarks. Projects here are only the first 3 of whatever the detail endpoint returned — no paging.

**Roles.** API: GET requireRole [10,15,50,60,69,70,45]; PATCH status [10,15,50,60,69,45,70]; DELETE [10,15,45]. UI: ClientDetails shows Edit only for CLIENT_EDIT_ROLES [10,15,60,69,45,70]; the Delete Client button has NO role check at all (unlike the lead screen, which checks role === 10) — every viewer sees it and gets a 403 from the API. /clients/:id/edit is proxy-gated [10,45,60,69,70]; /clients/:id/projects/create is proxy-gated [10,45,60,70].

**Components.** ClientDetails, ClientStatusDropdown, ClientProjectPreviewCard, LeadInteractionActions, InteractionInlineForm, InteractionTimeline, CreateActionButton, WhatsAppLink, StatusBadge, TimeAgo, ClientDetailsSkeleton, AccessDenied

**On a phone.** Same modal/sheet work as the lead detail screen (status sheet, four interaction forms, file pickers, date/time pickers, delete via Alert). Extra: the 'Converted from Lead' block is a 4-column <dl> that must collapse; the Projects section plus the timeline plus the header makes a very long scroll — consider segmented tabs (Overview / Timeline / Projects) on phone; the duplicate 'Create New Project' button and + FAB should collapse into one FAB, offset above the tab bar; the Delete Client button needs the missing role check added client-side. Note the page re-fetches the whole client after a status change but does not refetch interactions (unlike the lead screen) — the 2510 timeline row only appears after a manual reload.

**Size.** L

---

## `/admin/operations/clients/[clientId]/edit`

**Purpose.** Edit a client's name, company, email and phone. Loads the client, then renders ClientForm in mode='edit' (region is create-only).

**Web files:** `src/app/admin/operations/clients/[clientId]/edit/page.tsx`, `src/components/admin/operations/ClientForm.tsx`

**API calls**
- GET /api/admin/operations/clients/:id — on mount, seeding from data.data.client
- PATCH /api/admin/operations/clients/:id — on submit; field === 'phone' responses set the inline phone error

**State.** Local only.

**Roles.** proxy.ts: /admin/operations/clients/<24-hex>/edit → [10,45,60,69,70]. API PATCH requireRole [10,15,60,69,70,45].

**Components.** ClientForm, PhoneField, PhoneHint, WriteRegionField (create mode only)

**On a phone.** Straight form port: KeyboardAvoidingView, proper keyboard types, native toast, navigator-level role gate replacing the proxy. Loading / not-found are bare divs — replace with skeleton and empty state.

**Size.** S

---

## `/admin/operations/clients/[clientId]/projects`

**Purpose.** All projects belonging to one client, 5 per page, with a 'Create New Project' button.

**Web files:** `src/app/admin/operations/clients/[clientId]/projects/page.tsx`, `src/components/admin/operations/ClientProjectPreviewCard.tsx`, `src/components/admin/operations/CreateActionButton.tsx`

**API calls**
- GET /api/admin/operations/clients/:id/projects — once on mount; returns the full array, unpaginated

**State.** Local page + totalPages only (useState, NOT in the URL — unlike every other list in the app). Pagination is pure client-side slicing of the full response at 5 per page. No search, no status filter, no sort. It imports SearchBar and StatsPanel but never renders them.

**Roles.** API GET only requireAuth (any logged-in user) — one of the open endpoints §11 of the port plan says to close. No proxy rule. The page has no AccessDenied handling at all.

**Components.** ClientProjectPreviewCard, CreateActionButton, ProjectCardSkeleton

**On a phone.** Replace the client-side slice-by-5 with a plain FlatList over the whole array (the response is already complete) and drop the prev/next bar. The page re-declares its own `max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-2` container inside the operations layout, which double-wraps the content — delete that wrapper entirely for RN. The dead SearchBar/StatsPanel imports should not be carried over. Candidate for merging into the client detail screen as a 'Projects' tab rather than a separate route.

**Size.** S

---

## `/admin/operations/clients/[clientId]/projects/create`

**Purpose.** Create a project for a known client. Shows a read-only client info card, then a form of title, description, service type, status and budget; clientId comes from the route, so nothing has to be typed. Redirects to the projects list after 3s.

**Web files:** `src/app/admin/operations/clients/[clientId]/projects/create/page.tsx`, `src/components/admin/operations/ClientInfoCard.tsx`

**API calls**
- GET /api/admin/operations/clients/:id — ClientInfoCard on mount
- POST /api/admin/operations/projects — on submit, body { ...form, clientId, budget: Number }

**State.** Local form state only.

**Roles.** proxy.ts: /admin/operations/clients/<24-hex>/projects/create → [10,45,60,70]. API POST requireRole [10,15,45,50,60,70].

**Components.** ClientInfoCard, PhoneText

**On a phone.** Long single-column form (title, multiline description, two selects, budget) — needs KeyboardAvoidingView, numeric keyboard for budget, native pickers for serviceType and status (both are enum <select>s built from Service and PROJECT_STATUS). Replace the 3s setTimeout redirect with immediate navigation plus a toast. This is the screen that should survive; /projects/create (below) should not.

**Size.** M

---

## `/admin/operations/projects`

**Purpose.** Paged, filterable list of all projects across clients — status + date-range filters, one card per project showing title, description, service badge, status, budget, the client (name + company) and created-by.

**Web files:** `src/app/admin/operations/projects/page.tsx`, `src/app/admin/operations/projects/ProjectsClient.tsx`, `src/components/admin/operations/ProjectCard.tsx`, `src/components/admin/operations/ListFilters.tsx`, `src/components/admin/operations/Pagination.tsx`, `src/hooks/usePagination.ts`, `src/hooks/useSearch.ts`

**API calls**
- GET /api/admin/operations/projects?page&limit=10&search&status&from&to — on mount and whenever page, search, status, from or to changes

**State.** Same URL-driven shape as leads/clients: `page`, `search`, `status`, `from`, `to`; PAGE_SIZE 10; no sort; no result-count line; no create button or FAB on this screen.

**Roles.** API GET requireRole [10,15,45,50,60,70]; 403 → AccessDenied. No proxy rule. Sidebar hides Projects for roles 65 and 69.

**Components.** ProjectCard, ListFilters, DateField, Pagination, StatusBadge, ServiceBadge, TimeAgo, Tooltip, ProjectCardSkeleton, AccessDenied

**On a phone.** Same list treatment as leads/clients (infinite scroll, filter sheet, in-screen search). PROJECT_STATUS has 8 values (110–180), so the status filter needs a scrollable picker rather than a short menu. ProjectCard carries the most text of the three cards (title + description + service + budget + client) — truncate description to 2 lines on phone and move budget onto its own row.

**Size.** M

---

## `/admin/operations/projects/[projectId]`

**Purpose.** Project workspace: detail card (title, client link, service badge, budget, status dropdown with required remarks, Edit link), the same four add-interaction actions and full timeline (entityType 2), and a Delete Project button.

**Web files:** `src/app/admin/operations/projects/[projectId]/page.tsx`, `src/components/admin/operations/ProjectDetail.tsx`, `src/components/admin/operations/statusDropdowns/ProjectStatusDropdown.tsx`, `src/components/admin/operations/LeadInteractionActions.tsx`, `src/components/admin/operations/InteractionModal/InteractionInlineForm.tsx`, `src/components/admin/operations/interactions/InteractionTimeline.tsx`

**API calls**
- GET /api/admin/operations/projects/:id — on mount and again after every status change; returns { data: project }
- GET /api/admin/operations/projects/:id/interactions — on mount, after a status change and after any interaction form succeeds
- PATCH /api/admin/operations/projects/:id/status — confirming a status change (body { status, remarks })
- DELETE /api/admin/operations/projects/:id — Delete Project, confirmed via a toast action
- POST /api/admin/operations/notes | /calls | /meetings | /quotations — the four interaction forms, with entityType 2
- GET /api/admin/operations/users/picker — MeetingForm attendee list
- PATCH /api/admin/operations/interactions/:id — inline note / status-remark editing

**State.** No URL state. Local: project, interactions, loading flags, activeType, isOpen, deleting, pendingStatus + remarks.

**Roles.** API: GET requireRole [10,15,45,50,60,70]; PATCH status [10,15,50,60,45,70]; DELETE [10,15,60,45,70]. UI: ProjectDetail shows Edit only for PROJECT_EDIT_ROLES [10,15,60,45,70]; the Delete Project button has no role check. /projects/:id/edit is proxy-gated [10,45,60,70].

**Components.** ProjectDetail, ProjectStatusDropdown, LeadInteractionActions, InteractionInlineForm, InteractionTimeline, ServiceBadge, StatusBadge, WhatsAppLink, TimeAgo, ProjectDetailSkeleton, AccessDenied

**On a phone.** Mirrors the lead/client detail work: status popover → bottom sheet with the remarks step, four interaction forms → full-screen modals with native file and datetime pickers, delete via Alert, hover-only edit icons → permanent touch targets, timeline as a FlatList with the detail card as ListHeaderComponent. Project-specific: the 8-value status picker needs to be scrollable, and the client link in the header should be a tappable row, not inline underlined text.

**Size.** L

---

## `/admin/operations/projects/[projectId]/edit`

**Purpose.** Edit a project: client id, company name, title, description, service type, status and budget. Loads the project, maps it to form values, then renders ProjectEditForm.

**Web files:** `src/app/admin/operations/projects/[projectId]/edit/page.tsx`, `src/components/admin/operations/ProjectEditForm.tsx`

**API calls**
- GET /api/admin/operations/projects/:id — on mount, to seed the form
- PATCH /api/admin/operations/projects/:id — on submit, body { clientId, title, description?, serviceType?, status, companyName?, budget? }

**State.** Local only.

**Roles.** proxy.ts: /admin/operations/projects/<24-hex>/edit → [10,45,60,70]. API PATCH requireRole [10,15,45,50,60,70].

**Components.** ProjectEditForm

**On a phone.** The 'Client' field is a free-text input holding a raw Mongo ObjectId, required and validated only for non-emptiness — unusable on a phone. Replace it with a read-only client row (the id is already known from the loaded project) or a searchable client picker. Otherwise a standard long form: KeyboardAvoidingView, numeric budget keyboard, native pickers for serviceType and status.

**Size.** M

---

## `/admin/operations/projects/create`

**Purpose.** Standalone 'create project for an existing client' form — the same fields as the per-client version, but the client has to be identified by pasting a raw Client ID.

**Web files:** `src/app/admin/operations/projects/create/page.tsx`

**API calls**
- POST /api/admin/projects — on submit. NOTE: this path does not exist in the app (src/app/api/admin has no projects route); the real endpoint is /api/admin/operations/projects, which the per-client create page uses. This screen's submit cannot succeed as written.

**State.** Local form state only. Nothing in the URL. No loading/not-found states, and errors are surfaced with window.alert(), not toasts.

**Roles.** None anywhere: no proxy.ts rule matches /admin/operations/projects/create, the page does no role check, and the endpoint it posts to does not exist. (The per-client equivalent is gated to [10,45,60,70].)

**Components.** (none — inline markup only)

**On a phone.** Do not port as-is. It depends on typing a 24-char ObjectId into a text field and calls a dead endpoint; it also uses window.alert() which has no RN equivalent. Either drop it and make /clients/:id/projects/create the only creation path, or rebuild it with a searchable client picker and point it at /api/admin/operations/projects.

**Size.** S

---

## `/ (root shell, not a visible screen)`

**Purpose.** Next.js root layout: fonts, globals.css, sonner <Toaster position="top-center" theme="dark" richColors>, AuthProvider -> RegionProvider -> ImageKitProvider, and SWRegister (registers /sw.js for PWA). Sets app metadata + themeColor (#4A6FA5 light / #183668 dark). This is the provider tree every screen depends on.

**Web files:** `src/app/layout.tsx`, `src/app/sw-register.tsx`, `src/app/manifest.ts`, `src/contexts/AuthContext.tsx`, `src/contexts/RegionContext.tsx`, `src/app/globals.css`

**API calls**
- GET /api/auth/me (via AuthProvider on mount, credentials: include, cache no-store -> { data: { id, name, email, role, regions[], activeRegion, avatar } } or null)
- POST /api/auth/logout (AuthContext.logout, then router.push /admin/authentication/login after a 500ms toast delay)
- POST /api/auth/region (RegionProvider.setActive -> sets the active-region cookie that scopes every other API)

**State.** AuthContext: { user, loading, isAuthenticated, role, regions, refreshUser, logout }. RegionContext: { regions, active, setActive, switching, isAll, canSwitch }, seeded from /api/auth/me. Both are global and must exist before any screen renders.

**Roles.** None itself, but it supplies `role` and `regions` that every gate below reads.

**Components.** AuthProvider, RegionProvider, ImageKitProvider, Toaster (sonner), SWRegister

**On a phone.** RN port: replace AuthProvider's cookie-based fetch with a token store (SecureStore/AsyncStorage + Authorization: Bearer) since RN has no cookie jar by default; replace sonner with react-native-toast-message or a custom snackbar; ImageKitProvider has no RN equivalent - build the transformation URL by hand (tr:w-144,h-144) and feed it to <Image>/expo-image; SWRegister and manifest.ts are web-only, drop them (Android PWA shortcuts become app shortcuts if wanted). themeColor pair maps to a React Navigation theme + StatusBar barStyle.

**Size.** medium

---

## `/ (landing page)`

**Purpose.** Static splash: ZAN logo (light/dark variants), title "Zan Workspace", one-line subtitle, and a single "Go to dashboard" link to /admin/operations. No auth check, no data.

**Web files:** `src/app/page.tsx`

**State.** None. Pure server component.

**Roles.** None. The proxy does not guard `/`.

**Components.** next/image (two logos swapped by dark: class), next/link, lucide ArrowRight

**On a phone.** In a mobile app this page is dead weight - the app should boot straight to a splash/auth gate: if a token exists go to the Dashboard tab, otherwise go to Login. Keep only the logo asset and the light/dark swap (useColorScheme()).

**Size.** low

---

## `/admin/operations/* (operations layout shell)`

**Purpose.** The chrome every operations screen sits inside: desktop sidebar (hidden md:block), fixed mobile top bar + 14px spacer, a header row holding SearchBar (8 cols) and NotificationBell (desktop only, 4 cols), a 3-column body where children take lg:col-span-2 and a sticky right aside holds StatsPanel + UpcomingMeetingsPanel, and a fixed mobile bottom nav.

**Web files:** `src/app/admin/operations/layout.tsx`, `src/components/admin/operations/SideBar.tsx`, `src/components/admin/operations/MobileNav.tsx`, `src/components/admin/operations/MobileTopBar.tsx`, `src/components/admin/operations/SearchBar.tsx`, `src/components/admin/operations/StatsPanel.tsx`, `src/components/admin/operations/UpcomingMeetingsPanel.tsx`, `src/components/admin/operations/NotificationBell.tsx`, `src/components/admin/operations/NotificationBadge.tsx`, `src/components/admin/operations/region/RegionSwitcher.tsx`, `src/assets/css/MobileNav.module.css`

**API calls**
- GET /api/admin/operations/stats (StatsPanel, on every pathname change)
- GET /api/admin/operations/meetings?range=upcoming&limit=20 (UpcomingMeetingsPanel, re-sorted client-side soonest-first, sliced to VISIBLE_COUNT)
- GET /api/admin/operations/search?search=<term> (SearchBar, dashboard mode only, 300ms debounce, min 2 chars)
- GET /api/notifications?limit=4 (NotificationBell, on mount then every 30s)
- PATCH /api/notifications/seen (NotificationBell, fired when the dropdown is opened and unseen > 0)
- PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all (NotificationBell row actions)

**State.** Sidebar/MobileNav: useAuth() + usePathname() for active item and role filtering; MobileNav also keeps `visible` (hide on scroll down past 64px, show on scroll up, 8px threshold), `activeIndex`, and a measured `gapPx` for the sliding indicator. MobileTopBar: `open` (profile menu), `moreOpen` (overflow menu), `avatarBroken`. NotificationBell: `open`, `rows`, `unseen`, `unread`, `loading`, 30s setInterval poll, optimistic read marking with a refetch on failure. SearchBar: URL-synced `?search=` on list routes (debounced router.replace, deletes `page`), or a dashboard-mode dropdown with keyboard nav (ArrowUp/Down/Enter/Escape) over flattened leads+clients+projects+meetings hits.

**Roles.** Sidebar nav items are role-filtered per entry: Dashboard/Leads/Meetings [10,15,20,30,40,42,45,50,60,65,69,70,80]; Lead Sources LEAD_SOURCE_ACCESS_ROLES; Clients [10,15,20,30,40,42,45,50,60,69,70,80]; Projects [10,15,20,30,40,42,45,50,60,70,80]; Overall Stats [10,15,20,30,40,42,45,50,60,70,80]; Users [10,20,45,69]; Activity Log [10,20]. MobileNav shows only 6 items (Dashboard, Leads, "Calls" = lead-sources, Clients, Projects, Users [10,15,20,69]) - note Users has a DIFFERENT role list than the sidebar. Meetings / Activity Logs / Overall Stats are reachable on mobile only through the MobileTopBar "More" (MoreVertical) menu. Both navs render null while auth is loading or when there is no user.

**Components.** SideBar, MobileNav (CSS-module floating indicator + hood), MobileTopBar, SearchBar, SearchResults, NotificationBell, NotificationBadge, StatsPanel, UpcomingMeetingsPanel, RegionSwitcher (full in sidebar, compact flag-only in top bar), TimeAgo

**On a phone.** This is the single most important thing to port and the one place the web app already made mobile decisions - reuse them. Target shape: a bottom tab navigator with the 6 MobileNav items (role-filtered at runtime, so the tab list must be built after /api/auth/me resolves - RN navigators dislike changing screen sets, so register all tabs and set tabBarButton: () => null for the ones the role lacks), plus a header with logo + compact region flag + bell + avatar menu. The hide-on-scroll bottom nav should be dropped on Android (system back gesture + a disappearing tab bar is a bad combo) or re-done with Reanimated's useAnimatedScrollHandler. The desktop right-hand aside (StatsPanel + UpcomingMeetingsPanel) has no place in a phone layout - fold those two panels into the Dashboard screen instead of every screen. SearchBar becomes either a per-screen search input (list routes) or a dedicated Search screen/modal (dashboard mode) - a dropdown overlay over an input does not translate. The 30s notification poll should become a foreground-only poll (AppState listener) and, ideally, FCM push on Android. The "More" overflow menu becomes a Drawer or a "More" tab holding Meetings / Activity Logs / Overall Stats / Profile.

**Size.** high

---

## `/admin/operations/meetings`

**Purpose.** Paginated list of all meetings with filters (status, entity type, temporal quick-range) and inline actions on each card: reschedule, cancel, mark completed with an outcome note.

**Web files:** `src/app/admin/operations/meetings/page.tsx`, `src/app/admin/operations/meetings/MeetingsClient.tsx`, `src/components/admin/operations/MeetingCard.tsx`, `src/components/admin/operations/MeetingFilters.tsx`, `src/components/admin/operations/RescheduleMeetingForm.tsx`, `src/components/admin/operations/MeetingLinkButton.tsx`, `src/components/admin/operations/skeletons/MeetingCardSkeleton.tsx`, `src/utils/MeetingTemporalStatus.ts`, `src/hooks/usePagination.ts`, `src/hooks/useSearch.ts`, `src/lib/auth/handleAuthError.ts`

**API calls**
- GET /api/admin/operations/meetings?page&limit=10&search&status&range&entityType (list; note the response uses pagination.totalPages while every other list API uses pagination.pages - the client falls back across both)
- PATCH /api/admin/operations/meetings/:id/status (MeetingCard: CANCELLED, or COMPLETED + outcome note)
- PATCH /api/admin/operations/meetings/:id/reschedule (RescheduleMeetingForm)

**State.** meetings[], loading, totalPages, accessError. page from usePagination (URL ?page), search from useSearch (URL ?search, written by the layout SearchBar), status/range/entityType read straight off useSearchParams. fetchMeetings is a useCallback re-fired by any of those; handleAuthError() turns 401 into a toast + replace(/login) and 403 into an <AccessDenied> render. Each MeetingCard owns expanded, rescheduleOpen, completeOpen, outcome, submittingComplete, markingMissed, outcomeExpanded.

**Roles.** Page: visible in the sidebar for [10,15,20,30,40,42,45,50,60,65,69,70,80]; the proxy does not guard /meetings and GET /api/admin/operations/meetings only calls requireAuth, so any signed-in user can read the list. Actions: RESCHEDULE_ROLES = CLOSE_ROLES = [10,15,60,65,69,45,70] gate the reschedule/cancel/complete buttons client-side; the status API requires [10,15,50,60,65,69,45,70] and reschedule requires [10,15,45,50,60,65,69,70] - the three lists do not match exactly, so a role-50 user sees no buttons but would be allowed by the API.

**Components.** MeetingsClient, MeetingFilters, MeetingCard, MeetingCardSkeleton (x5 while loading), RescheduleMeetingForm, MeetingLinkButton, StatusBadge, TemporalBadge, TimeAgo, Pagination, AccessDenied

**On a phone.** Swap the mapped list for FlatList with keyExtractor on _id and pull-to-refresh calling fetchMeetings; keep the 5 skeleton cards as ListEmptyComponent while loading. URL-driven state (page/search/status/range/entityType) has no RN equivalent - move it into component state or a Zustand/Jotai store, which also removes usePagination/useSearch. MeetingFilters' two <select> dropdowns become @react-native-picker/picker or an ActionSheet; the four range chips (All/Today/Last 7 days/Upcoming) already work as a horizontal Pressable row. The complete-with-outcome and reschedule flows should become bottom sheets (@gorhom/bottom-sheet) rather than inline expanding sections. MeetingCard resolves its icon via `(Icons as any)[...]` on lucide-react - that dynamic lookup must become an explicit name->component map for lucide-react-native since RN has no tree-shaking escape hatch. The Google Meet link should open with Linking.openURL. Note the existing entityHref bug: it builds `/admin//operations/...` with a double slash.

**Size.** high

---

## `/admin/operations/notifications`

**Purpose.** Full notification inbox: All / Unread toggle, cursor-paginated list, per-row mark-read (and navigate to row.url), mark-all-read, plus a note that rows older than 30 days are auto-removed. Three visual states per row: fresh (unread + unseen, blue + "New" pill), unread-but-seen (amber), read (plain).

**Web files:** `src/app/admin/operations/notifications/page.tsx`, `src/components/admin/operations/NotificationBadge.tsx`, `src/components/admin/operations/dayjs/TimeAgo.tsx`, `src/app/api/notifications/route.ts`

**API calls**
- GET /api/notifications?limit=15[&before=<cursor>][&unread=true] -> { data, unseen, unread, total, nextCursor }
- PATCH /api/notifications/seen (fired exactly once per mount via a seenFiredRef guard)
- PATCH /api/notifications/:id/read (optimistic, fire-and-forget)
- PATCH /api/notifications/read-all (optimistic + toast)

**State.** rows, unread, total, loading, filter ('all' | 'unread'), and a hand-rolled cursor stack: cursors: (string|null)[] starting [null], pageIdx, nextCursor. goNext pushes nextCursor and truncates forward history; goPrev replays cursors[pageIdx-1]. rangeStart/rangeEnd/totalPages are derived from pageIdx * 15.

**Roles.** None beyond being signed in - GET /api/notifications is requireAuth and scoped to recipient = authUser.id, so everyone sees only their own rows. Not present in either nav list; reached from the bell's "View all notifications" footer link.

**Components.** NotificationBadge (emoji-or-name -> lucide icon + color map), TimeAgo, lucide Bell/Check/CheckCheck/ChevronLeft/ChevronRight/Loader2, sonner toast

**On a phone.** Natural fit for FlatList + onEndReached infinite scroll instead of the Newer/Older cursor buttons - the cursor stack only exists because the web wanted discrete pages; keep `before=nextCursor` and append. Swipe-to-mark-read (react-native-gesture-handler Swipeable) replaces the small check button, which is well under the 44dp touch target today. row.url is a web path - add a deep-link resolver that maps /admin/operations/leads/:id etc. onto RN screen names rather than passing it to a Linking call. The 'New' pill, the blue/amber/plain left-border states and the 30-day note all port directly. Pair with FCM so the inbox is not the only way to learn about an event.

**Size.** medium

---

## `/admin/operations/profile`

**Purpose.** Read-only view of the signed-in user's own account: avatar, name, email, role label, active/inactive pill, member-since / last-login / last-updated dates, who created the account, plus an embedded 'My activity' section (the same activity-log filters + list, locked to this user).

**Web files:** `src/app/admin/operations/profile/page.tsx`, `src/components/admin/operations/activityLog/ActivityLogFilters.tsx`, `src/components/admin/operations/activityLog/ActivityLogList.tsx`, `src/components/admin/operations/activityLog/types.ts`, `src/constants/userRoles.ts`, `src/types/authProfile.ts`

**API calls**
- GET /api/auth/profile (credentials include, no-store; 401 -> router.replace to login)
- GET /api/admin/operations/activity-logs?page&limit=15&userId=<self>[&entityType&from&to] (via ActivityLogList with forceUserId)

**State.** loading, profile (AuthProfileUser), avatarBroken, activityFilters (ActivityLogFilterState seeded from EMPTY_FILTERS). ActivityLogList keeps its own logs/pagination/loading/error plus a reqIdRef to drop stale responses and a 300ms debounce on free-text search only.

**Roles.** None - any signed-in user sees their own profile. ActivityLogFilters is rendered with isAdmin={false}, which hides the user picker, and forceUserId overrides any userId the filters could set; the API independently scopes non-admins ([10,20] are admin) to their own rows.

**Components.** ActivityLogFilters, ActivityLogList, ActivityLogItem, Pagination, ImageKit <Image> avatar with onError fallback to a lucide User icon, USER_ROLE_META for the role label

**On a phone.** Straight port. The <dl> grid of date cells becomes a simple label/value column. Avatar: ImageKit transformation array has to become a URL string (?tr=w-160,h-160) for RN <Image>. toLocaleString with dateStyle/timeStyle is unreliable on older Android JSC/Hermes builds without full-icu - use dayjs (already a dependency via TimeAgo) for every date here. The activity section inside a profile screen means a nested scrolling list - render it as the FlatList and put the profile card in ListHeaderComponent rather than nesting a list inside a ScrollView.

**Size.** medium

---

## `/admin/operations/profile/edit`

**Purpose.** Self-service profile edits - only two things: change the avatar photo (hidden file input + 'Change photo' button, JPEG/PNG up to 5 MB) and change the password (current / new / confirm, each with an eye toggle). Name, email and role are read-only here.

**Web files:** `src/app/admin/operations/profile/edit/page.tsx`, `src/app/api/auth/profile/avatar/route.ts`, `src/app/api/auth/profile/password/route.ts`, `src/contexts/AuthContext.tsx`

**API calls**
- GET /api/auth/profile (load; 401 -> replace to login)
- POST /api/auth/profile/avatar (multipart FormData, field name `avatarFile`; on success reloads the profile and calls AuthContext.refreshUser so the sidebar/top-bar avatar updates)
- PATCH /api/auth/profile/password ({ oldPassword, newPassword }; on success clears the three fields and router.push back to /profile)

**State.** loading, profile, avatarBroken, avatarUploading, oldPassword/newPassword/confirmPassword, passwordSaving, showOld/showNew/showConfirm. Client-side validation before submit: all fields required, newPassword >= 6 chars, newPassword === confirmPassword, each failure a toast.

**Roles.** None - acts on the signed-in user only.

**Components.** local PasswordField sub-component (label + input + eye/eye-off toggle), ImageKit <Image>, hidden <input type=file accept="image/jpeg,image/png">, sonner toasts

**On a phone.** The file input becomes react-native-image-picker / expo-image-picker (camera + gallery), which also lets you enforce the 5 MB and JPEG/PNG limits before upload; FormData with { uri, name, type } works in RN fetch. Password fields map to TextInput secureTextEntry with textContentType='password'/'newPassword' and autoComplete so Android's password manager can fill them; keep the eye toggle. Wrap the form in KeyboardAvoidingView - three stacked inputs plus a submit button is exactly the case where the Android keyboard hides the button. On success, popping back to the Profile screen replaces router.push.

**Size.** medium

---

## `/admin/operations/users`

**Purpose.** Paginated staff directory (5 per page) with search, a UserCard per row showing avatar/name/email/role/active pill/regions/created+lastLogin, a pencil edit affordance pinned bottom-right of each card, a top 'Create New User' button and a fixed floating + FAB.

**Web files:** `src/app/admin/operations/users/page.tsx`, `src/app/admin/operations/users/UsersClient.tsx`, `src/components/admin/operations/UserCard.tsx`, `src/components/admin/operations/UserCardSkeleton.tsx`, `src/components/admin/operations/CreateActionButton.tsx`, `src/components/admin/operations/Pagination.tsx`, `src/components/admin/operations/AccessDenied.tsx`, `src/components/admin/operations/region/RegionBadge.tsx`

**API calls**
- GET /api/admin/operations/users?page&limit=5[&search] -> { data, pagination: { page, limit, total, pages } }

**State.** users[], loading, totalPages, accessError; page via usePagination (URL), search via useSearch (URL, written by the layout SearchBar). handleAuthError for 401/403 -> AccessDenied.

**Roles.** Proxy guards /admin/operations/users for roles [10,45,20,69]; sidebar shows the entry for [10,20,45,69] but MobileNav shows it for [10,15,20,69] (inconsistent - 15 can tap the mobile tab and be redirected to /unauthorized, 45 gets no mobile tab). API GET requires [10,15,20,69]. The 'Create New User' button renders only for role 10, 20 or 69 - but the floating + FAB is rendered unconditionally, so a role-45 user sees a FAB that leads to a page the proxy will bounce.

**Components.** UsersClient, UserCard, UserCardSkeleton (x5), CreateActionButton, Pagination, AccessDenied, RegionBadge, Tooltip, TimeAgo

**On a phone.** FlatList + pull-to-refresh; the per-card absolutely-positioned pencil becomes a trailing icon in the card row or a long-press menu. The fixed bottom-right FAB must clear the bottom tab bar - use useBottomTabBarHeight() plus useSafeAreaInsets, or it lands under the nav. Fix the FAB/role mismatch while porting: gate the FAB on the same [10,20,69] as the top button. Both create/edit hrefs are relative ('users/create'), which only works because of the current URL - RN navigation uses explicit screen names so this goes away.

**Size.** medium

---

## `/admin/operations/users/create`

**Purpose.** Thin wrapper around the shared UserForm: builds multipart FormData (name, email, password, role, one `regions` entry per selected region, isActive, optional avatarFile), POSTs it, shows a loading->success/error toast chain, then pushes back to the users list.

**Web files:** `src/app/admin/operations/users/create/page.tsx`, `src/components/admin/operations/UserForm.tsx`, `src/components/admin/operations/region/RegionSelect.tsx`, `src/components/admin/operations/dropzone/FileUpload.tsx`, `src/components/admin/operations/AvatarPreview.tsx`, `src/app/api/admin/operations/users/route.ts`

**API calls**
- POST /api/admin/operations/users (multipart/form-data)

**State.** loading. UserForm owns the field state: name, email, password, role (defaults to the first selectable role), regions (pre-filled with your own region when you only hold one), isActive, avatar, avatarFile, plus regionError ('Pick at least one region' - checkboxes cannot be `required`).

**Roles.** Proxy: [10,20,69]. API POST: requireRole [10,20,69]. The role <select> is filtered by USER_ROLE_META and RegionSelect only offers the regions the signed-in admin holds.

**Components.** UserForm, RegionSelect, FileUpload (dropzone), AvatarPreview, USER_ROLE_META (label + description under the select), sonner toast.loading/success/error with a shared id

**On a phone.** Longest form in this batch - needs KeyboardAvoidingView plus a ScrollView with keyboardShouldPersistTaps='handled'. The drag-and-drop FileUpload has no RN analogue: replace with an image picker button. Role <select> -> Picker/bottom sheet, region checkboxes -> a list of toggle rows or chips. Creating a user emails them their password, so add a confirm step on mobile where a mis-tap is cheap. Password field here is a real credential input - mark it secureTextEntry with autoComplete='new-password'.

**Size.** high

---

## `/admin/operations/users/[userId]/edit`

**Purpose.** Same UserForm in mode='edit', pre-filled from the loaded user, but the submit handler does a diff: it appends only the fields that actually changed (name, email, role, isActive, regions as a sorted-join comparison, password only when non-blank, avatarFile or removeAvatar=true) and shows 'Nothing changed yet' when the FormData ends up empty.

**Web files:** `src/app/admin/operations/users/[userId]/edit/page.tsx`, `src/components/admin/operations/UserForm.tsx`, `src/app/api/admin/operations/users/[id]/route.ts`

**API calls**
- GET /api/admin/operations/users/:id (load; has an `ignore` cleanup flag against races)
- PATCH /api/admin/operations/users/:id (multipart, partial)

**State.** user (LoadedUser), fetching, loadError, loading. Renders three distinct states: a 'Loading user...' card, a 'This user could not be loaded' card with a Back to users button, or the form (keyed on user._id so a different user remounts it).

**Roles.** Proxy: [10,20] for .../edit. API PATCH: requireRole [10,20] (GET by id allows [10,20,69]). Extra in-page rule: when signedInUser.id === user._id the regions control is locked with the reason 'You cannot change your own regions. Ask another admin.' - and the diff deliberately omits unchanged regions because sending them would turn a no-op save into a 403.

**Components.** UserForm (mode='edit', key, defaultValues, regionsLockedReason), RegionSelect with `existing`, FileUpload, sonner toasts

**On a phone.** Keep the changed-fields-only diff exactly as written - it is load-bearing for the self-regions 403, not an optimization. Same keyboard/picker/image-picker treatment as the create screen. The two error/loading cards become simple centered states. Password left blank = unchanged is a non-obvious rule; keep the helper text visible on a small screen rather than as a placeholder.

**Size.** high

---

## `/admin/operations/activity-logs`

**Purpose.** Admin-only system audit feed: header, a filter card (entity type, user picker, from/to dates, free-text q) and a paginated list of ActivityLogItem rows. Non-admins get a yellow 'Restricted area' card pointing them at their own profile instead.

**Web files:** `src/app/admin/operations/activity-logs/page.tsx`, `src/app/admin/operations/activity-logs/ActivityLogsClient.tsx`, `src/components/admin/operations/activityLog/ActivityLogFilters.tsx`, `src/components/admin/operations/activityLog/ActivityLogList.tsx`, `src/components/admin/operations/activityLog/ActivityLogItem.tsx`, `src/components/admin/operations/activityLog/formatActivityValue.ts`, `src/components/admin/operations/activityLog/types.ts`, `src/components/admin/operations/activityLog/ActivityHeatmap.tsx`, `src/components/admin/operations/filters/DateField.tsx`

**API calls**
- GET /api/admin/operations/activity-logs?page&limit=15[&userId][&entityType][&from][&to][&q] -> { data, pagination: { page, limit, total, pages } }
- GET /api/admin/operations/users?limit=100 (ActivityLogFilters user picker, admin only)

**State.** filters (ActivityLogFilterState: entityType | '', userId, from, to, q), page via usePagination. ActivityLogList: logs, pagination, loading, error, reqIdRef to discard stale responses, isInitialMount ref so a shared ?page=3 link is not reset to 1 by the first filtersKey change, and a 300ms debounce applied only when filters.q is non-empty. `to` is pushed to 23:59:59.999 so the range reads as inclusive. Free-text q is ignored when a userId is selected.

**Roles.** ADMIN_ROLES = [10,20] client-side; sidebar shows the entry only for [10,20]; the proxy does NOT guard this path, so the gate is the component plus the API, which scopes any non-admin to filter.userId = self. Redirects to login when the auth context resolves with no user.

**Components.** ActivityLogsClient, ActivityLogFilters, ActivityLogList, ActivityLogItem, formatActivityValue, Pagination, ENTITY_TYPE_META for the entity dropdown

**On a phone.** Filter card -> a collapsible panel or a filter bottom sheet; four controls side by side will not fit at 360dp. The two date inputs need @react-native-community/datetimepicker (there is already a shared DateField for web at components/admin/operations/filters/DateField.tsx). The user picker fetches up to 100 users into a <select> - on mobile make it a searchable modal list. List -> FlatList with onEndReached instead of numbered Pagination. Admin-only and desktop-ish; consider shipping it behind the 'More' menu, or deferring it past v1 of the Android app. Note ActivityHeatmap.tsx (the GitHub-style year grid hitting /activity-logs/heatmap) exists in the codebase but is currently imported by nothing - do not port it unless you intend to wire it up.

**Size.** high

---

## `/admin/operations/overall-stats`

**Purpose.** 'Pipeline overview' dashboard: a 4-up KPI row, then a 2x2 grid of pie/doughnut cards (lead statuses, client statuses, project statuses, meeting statuses) each with its own colour palette and legend, running-project budget and user-role counts, a 'leads over time' card with a year drill-down into monthly bars, and a TimeAgo 'updated' stamp.

**Web files:** `src/app/admin/operations/overall-stats/page.tsx`, `src/components/admin/operations/OverallStatsPanel.tsx`, `src/components/admin/operations/Leadsovertimecard .tsx`, `src/components/admin/operations/statistics/LeadsMonthlyChart .tsx`, `src/app/api/admin/operations/overall-stats/route.ts`

**API calls**
- GET /api/admin/operations/overall-stats -> { leads: { total, byStatus, active, converted, lost, conversionRate, overTime[] }, clients, projects (incl. totalBudgetRunning), meetings (today/thisWeek/upcoming), users (byRole), updatedAt }

**State.** data (OverallStats | null), loading, error inside OverallStatsPanel; LeadsOverTimeCard keeps an expanded-year state that reveals LeadsMonthlyChart. Stats are server-cached for an hour and invalidated by the model plugins.

**Roles.** Sidebar entry for [10,15,20,30,40,42,45,50,60,70,80]; the API is requireAuth only, so effectively any signed-in user. Not in the mobile bottom nav - reachable only from the MobileTopBar 'More' menu.

**Components.** OverallStatsPanel (558 lines), EntityPieCard, LeadsOverTimeCard, LeadsMonthlyChart, chart.js + react-chartjs-2 (ArcElement, Tooltip; Pie and Doughnut), TimeAgo, hard-coded LEAD/CLIENT/PROJECT status colour metas

**On a phone.** The only screen here with a hard dependency that does not exist in RN: chart.js/react-chartjs-2 are canvas/DOM. Replace with react-native-svg + victory-native or react-native-gifted-charts, or render the charts in a WebView (not recommended for 4 charts on one screen). The 2x2 pie grid must become a single column, and pie legends with 8 project statuses are unreadable at phone width - consider horizontal stacked bars or a legend-as-list with counts. Keep the KPI row as a 2x2 grid. Budget figures use IndianRupee formatting - use Intl.NumberFormat('en-IN') carefully (same Hermes ICU caveat) or format manually.

**Size.** high

---

## `/admin/authentication/login`

**Purpose.** Email + password sign-in card: title, optional inline error block, email input, password input with an eye/eye-off toggle, submit button that reads 'Signing in...' while busy, and a footer line.

**Web files:** `src/app/admin/authentication/login/page.tsx`, `src/app/api/auth/login/route.ts`, `src/proxy.ts`

**API calls**
- POST /api/auth/login { email, password } -> 200 sets the httpOnly `auth_token` cookie (JWT { userId, role }, 7 days) and clears the active-region cookie; 400 'Email and password are required', 401 'Invalid credentials', 403 'Account is deactivated'. On success: toast, await refreshUser() (which re-hits /api/auth/me), then router.push('/admin/operations').

**State.** email, password, loading, showPassword, and an `error` state that is declared and rendered but never set (dead branch - all failures go through toast.error instead).

**Roles.** None - this is the only unauthenticated /admin route. The proxy inverts the gate here: an already-valid token on this path redirects to /admin/operations.

**Components.** sonner toast, lucide Eye/EyeOff, useAuth().refreshUser

**On a phone.** The whole auth model changes: RN fetch has no cookie jar, so the Express port must return the JWT in the body (or an Authorization header) and the app stores it in expo-secure-store / react-native-keychain and sends `Authorization: Bearer <token>` - the backend plan already states getUserFromRequest will accept Bearer alongside the cookie. Add KeyboardAvoidingView, keyboardType='email-address', autoCapitalize='none', textContentType email/password so Android autofill works, and returnKeyType='go' on the password field. Consider biometric unlock (react-native-biometrics) on relaunch so staff are not retyping a password in the field. Also wire the 403 'Account is deactivated' case to a distinct message - it is the one failure a user cannot fix themselves.

**Size.** low

---

## `/admin/authentication/unauthorized`

**Purpose.** Static 'Access Denied' page: shield icon, two explanatory lines, and two buttons - 'Go to Home' (/) and 'Back to Admin' (/admin/operations). Where the proxy sends an authenticated user who hits a path their role does not cover, and also where it sends anyone whose token fails verification.

**Web files:** `src/app/admin/authentication/unauthorized/page.tsx`, `src/components/admin/operations/AccessDenied.tsx`, `src/proxy.ts`

**State.** None.

**Roles.** None itself - it is the destination of every failed proxy RBAC check (users/create, users/:id/edit, leads/create, leads/:id/convert, leads|clients|projects/:id/edit, clients/:id/projects/create, lead-sources and lead-sources/upload|uploads).

**Components.** lucide ShieldAlert, useRouter

**On a phone.** In RN there is no route-level proxy, so this stops being a navigable page and becomes (a) a reusable <AccessDenied> screen/component - one already exists for API 403s at components/admin/operations/AccessDenied.tsx - and (b) navigation guards that simply do not expose the screen to a role that lacks it. Worth consolidating the two into one component during the port. Note the expired-token case currently lands here rather than on login, which on mobile should instead clear the stored token and route to Login.

**Size.** low

---

## `/book (PUBLIC - prospect-facing, not staff)`

**Purpose.** Public Calendly-style booking funnel for prospects on the Zan Services website. Three steps in one component: 'pick' (month calendar + available slot list for the chosen day), 'details' (name, email, phone with country select, company, free-text notes with a 1000-char counter, plus a hidden honeypot field), 'done' (confirmation card with the slot, the visitor's local-time hint, a Google Meet link and 'Book another time'). A left summary panel shows duration, Google Meet, office timezone and office hours throughout.

**Web files:** `src/app/book/page.tsx`, `src/app/book/BookingClient.tsx`, `src/components/phone/PhoneField.tsx`, `src/components/phone/useEditablePhone.ts`, `src/components/phone/CountrySelect.tsx`, `src/app/api/public/booking/route.ts`, `src/app/api/public/booking/slots/route.ts`

**API calls**
- GET /api/public/booking/slots -> { timeZone, slotMinutes, officeDays, officeStartMinutes, officeEndMinutes, days: [{ date, slots: [{ start, available }] }] } (rate-limited, no auth)
- POST /api/public/booking { name, email, phone, company, notes, company_website (honeypot), start } -> 201 { start, end, timeZone, meetingLink, email }; 409 'that time was just taken' -> toast, clear the slot, jump back to step 'pick' and silently refetch; 400 with a `field` key -> set that one field's inline error

**State.** availability, loadState ('loading'|'ready'|'error'), loadError, step, selectedDate, selectedSlot, viewMonth, form (name/email/company/notes/company_website), useEditablePhone() for the phone, fieldErrors, submitError, submitting, result, visitorZone (Intl resolvedOptions), plus timesRef/topRef for scroll-into-view on small screens.

**Roles.** None - fully public, mounted outside the auth proxy (the proxy only guards /admin). Rate limiting on the slots endpoint and a honeypot field are the only protections.

**Components.** BookingClient (862 lines), MonthCalendar, PickerSkeleton, Field, PhoneField + CountrySelect + useEditablePhone, next/image logos, sonner toast, heavy Intl.DateTimeFormat usage (formatTime, formatLongDate, formatDateKey, zoneLabel, localTimeHint)

**On a phone.** This page should NOT be in the internal staff Android app - see notes. If a mobile booking surface is ever wanted it belongs in a separate consumer build or stays a web page the staff app opens via Linking/WebView. If it were ported: the whole thing already degrades to one column (md: breakpoint) and the slot grid already reflows 2-col -> 3-col -> 1-col, so the layout is the easy part; the hard part is the timezone math - Hermes ships without full ICU by default, so every Intl.DateTimeFormat call with a timeZone option (used in six helpers here) needs either the jsc-intl/hermes-intl variant or a dayjs+timezone rewrite. The honeypot (absolutely-positioned off-screen input) is meaningless in a native app and should be dropped in favour of the server rate limit.

**Size.** high

---

## Notes
- File paths above are abbreviated with a leading … after the first entry of each screen; the full prefix is  and every path is relative to that.
- DESKTOP-ONLY / must be redesigned, not ported: (1) the operations layout's three-column grid — the sticky right aside holding StatsPanel + UpcomingMeetingsPanel exists on every screen and only makes sense beside content; on phone it currently just stacks below the whole page. (2) The layout-level SearchBar in dashboard mode — a floating overlay dropdown driven by ArrowUp/ArrowDown/Enter and a mousedown-outside handler; the keyboard navigation has no touch equivalent and the field belongs inside each list screen. (3) /admin/operations/projects/create — identifies the client by pasting a raw Mongo ObjectId and posts to a non-existent endpoint. (4) /admin/operations/projects/[projectId]/edit's Client field, same raw-ObjectId input. (5) The Tooltip component (components/admin/operations/tooltip/Tooltip.tsx) is bound to mouseenter/mousemove/mouseleave and portal-positioned at the cursor — on touch the 'Created by X' information it carries is simply unreachable, and it is used on LeadCard, ProjectCard, NoteItem, CallItem and QuotationItem.
- No screen under leads/clients/projects uses a wide table — everything is already a vertical card list, which is the single biggest point in favour of this port. The real work is in modals/popovers (status dropdowns, the four interaction forms), file inputs, date inputs and the hover-revealed affordances.
- Pagination is inconsistent and should be unified before porting: leads/clients/projects lists keep `page` in the URL (hooks/usePagination.ts) and use a prev/next bar at limit 10; clients/[clientId]/projects keeps page in local state and slices the full response at 5; the dashboard feed has no pagination at all and returns every lead, client and project with a lastInteractionAt in one payload. For RN, infinite-scroll FlatList + the existing page/limit API params is the natural target, and the dashboard endpoint needs a server-side limit.
- Role gating happens in three places that do not agree, and only two of them survive the port: proxy.ts (Next middleware — has no RN equivalent, must become navigator-level guards reading useAuth().role), per-component checks (LEAD_EDIT_ROLES [10,15,60,69,45,70], CLIENT_EDIT_ROLES [10,15,60,69,45,70], PROJECT_EDIT_ROLES [10,15,60,45,70], INTERACTION_EDIT_ROLES [10,15,60,69,45,50,70]), and the API's requireRole. Concrete mismatches worth fixing during the port: the Delete button is gated on role === 10 on the lead screen but ungated on the client and project screens (API allows [10,15,45] / [10,15,60,45,70]); /leads/:id/edit is proxy-gated to [10,45,60,69,70] while its Edit link shows for [10,15,60,69,45,70] and the API accepts [10,15,50,60,69,70,45].
- Roles in this clone are wider than the older spec: USER_ROLE_META adds 65 'US Sales Agent' and 69 'US Leads Manager'. There is also a region axis (src/lib/region, contexts/RegionContext, region/*): /api/auth/me returns regions + activeRegion, the switcher POSTs /api/auth/region and then does window.location.reload(), and lead/client create forms carry a WriteRegionField. RN must replace that reload with explicit query invalidation.
- Four endpoints these screens call are authenticated but not role-gated (requireAuth only): GET /leads/:id/interactions, /clients/:id/interactions, /projects/:id/interactions and /clients/:id/projects. The clients/[clientId]/projects page additionally has no 401/403 handling at all (no handleAuthError, no AccessDenied).
- Two refresh bugs to be aware of when wiring RN data fetching, since copying the current effect structure would carry them over: the client detail screen refetches the client after a status change but never refetches interactions, so the new 2510 timeline row does not appear; and the leads detail screen logs role to the console on every render (page.tsx line ~41).
- Not covered here but present under src/app/admin/operations and relevant to the full plan: lead-sources/** (LeadSourcesClient, upload, uploads, uploads/[uploadId], [sourceId]) — the newest module, gated by LEAD_SOURCE_ACCESS_ROLES [10,15,45,69,50,60,65,70] with MANAGE [10,15,45,69], WORK [50,60,65,70] and CONVERT [10,15,45,50,60,69,70] in src/constants/leadSourceRoles.ts; plus meetings/**, users/**, activity-logs/**, overall-stats, notifications and profile/**. The lead-sources upload flow (sheet upload) and activity-logs heatmap are the two most desktop-shaped areas outside this core set.
- DOES /book BELONG IN THE STAFF MOBILE APP? No. It is a public, unauthenticated, prospect-facing funnel: it is mounted outside the auth proxy, calls only /api/public/booking/slots and /api/public/booking, has no requireAuth anywhere, carries its own Zan Services branding and a honeypot anti-bot field, and exists so a website visitor can self-book a 30-minute Google Meet. Nothing on it is useful to an employee who is already signed in - staff schedule meetings through the meeting forms on a lead/client/project. Recommendation: exclude /book from the React Native app entirely. If sales ever want to hand a prospect a tablet or send a link, open the hosted web page with Linking.openURL - do not maintain a second native implementation of an 862-line timezone-heavy form.
- HOW THE OPERATIONS LAYOUT WORKS (src/app/admin/operations/layout.tsx). Desktop: a 64-wide sticky full-height Sidebar (`hidden md:block`) holding the logo + RegionSwitcher, a role-filtered nav list with an emerald left-border active state (the Dashboard entry matches exactly, every other entry matches href or href+'/'), and a bottom user block linking to /profile with a logout button that only appears on hover. To its right, a flex column: the fixed mobile top bar, a 14px spacer for it, a 14-high header grid (SearchBar in cols 1-8, NotificationBell in cols 9-12 but `hidden md:flex`), then a max-w-7xl body that is `lg:grid-cols-3` - children occupy lg:col-span-2 and a sticky right <aside> holds StatsPanel and UpcomingMeetingsPanel. Mobile: the sidebar is gone; OperationsMobileTopBar is `md:hidden fixed top-0` with logo, compact region flag, the same NotificationBell, an avatar button opening a Signed-in / Profile / Edit profile / Logout menu, and a MoreVertical button opening an overflow menu with Meetings, Activity Logs and Overall Stats. OperationsMobileNav is `md:hidden fixed bottom-0`, max-w-500px, centered, with a CSS-module floating indicator whose position is computed from the measured gap between the first two links, and it hides itself on scroll-down past 64px (8px delta threshold, rAF-throttled) by translating down 100%+50px so the indicator halo clears the viewport. Both navs return null while auth is loading or when there is no user. Critically: the right-hand aside is NOT hidden on mobile - StatsPanel and UpcomingMeetingsPanel stack below the page content on every operations screen, and both refetch on every pathname change.
- NOTIFICATION BELL POLLING. One NotificationBell component instance is rendered twice (desktop header and mobile top bar), so on a tablet-width breakpoint both can mount and each runs its own poll. Each instance: fetches GET /api/notifications?limit=4 on mount and then every 30000ms via setInterval (POLL_INTERVAL_MS), with credentials: 'include' and cache: 'no-store'. It tracks `unseen` (red count bubble on the bell) and `unread` (badge inside the dropdown header) separately. Opening the dropdown optimistically zeroes `unseen` and fires PATCH /api/notifications/seen; clicking a row optimistically sets readAt, decrements `unread`, fires PATCH /api/notifications/:id/read and refetches on failure; 'Mark all read' does the same via PATCH /api/notifications/read-all. Rows with a `url` wrap in a Link, rows without wrap in a click-only div. The footer links to /admin/operations/notifications. The interval is never paused when the tab is hidden - in React Native this must become an AppState-aware poll (foreground only) and ideally FCM push, because a 30s background timer will be killed by Android Doze anyway.
- ROLE-LIST INCONSISTENCIES WORTH FIXING DURING THE PORT, not replicating blindly: (1) Users nav - sidebar [10,20,45,69] vs MobileNav [10,15,20,69] vs proxy [10,45,20,69] vs API GET [10,15,20,69]; a role-45 user gets a sidebar link but no mobile tab, a role-15 user gets a mobile tab that the proxy bounces to /unauthorized. (2) The users list renders an unconditional floating + FAB while the inline 'Create New User' button is gated on [10,20,69]. (3) Meetings actions - client RESCHEDULE_ROLES/CLOSE_ROLES [10,15,60,65,69,45,70] vs status API [10,15,50,60,65,69,45,70] vs reschedule API [10,15,45,50,60,65,69,70]. (4) /meetings, /overall-stats, /activity-logs and /notifications are not in the proxy's routePermissions at all - activity-logs is gated only by ActivityLogsClient's own ADMIN_ROLES=[10,20] check plus server-side self-scoping. A native app should centralise one canonical role map (mirroring the ROLE_GROUP constants the Express port is introducing) and derive both navigation visibility and in-screen action gating from it.
- CROSS-CUTTING WEB DEPENDENCIES THAT HAVE NO RN EQUIVALENT and need a decision before session 1 of the port: (a) URL-as-state - usePagination and useSearch put page/search/status/range/entityType in the query string and the layout SearchBar writes ?search= for whichever list route is mounted; none of this survives in RN, so every list screen needs local or store-held filter state and its own search input. (b) next/link + next/navigation router.push/replace -> React Navigation. (c) chart.js / react-chartjs-2 (overall-stats only) -> victory-native or react-native-gifted-charts. (d) @imagekit/next <Image> with a `transformation` prop -> build tr: URLs by hand. (e) sonner Toaster -> a native toast/snackbar. (f) react-dropzone-style FileUpload -> image picker. (g) Tailwind class strings everywhere -> NativeWind keeps them nearly verbatim and is the lowest-friction choice given how much of this UI is dark:-variant utility classes. (h) Intl.DateTimeFormat with a timeZone option (booking page, profile dates) -> verify Hermes ICU or move to dayjs/timezone, which the codebase already uses for TimeAgo.
- WINDOWS/iOS FROM THE SAME REPO: everything in this batch is plain React + fetch + state; nothing is Android-specific, so react-native-windows and iOS can share the screens. The two places to watch are the bottom-tab-plus-FAB layout (needs a wider master/detail layout on Windows, where the original desktop sidebar + right-aside design is actually the better fit and can be reinstated behind a breakpoint) and anything touching the file system / pickers / secure storage, which needs a per-platform module. Keeping the layout shell a single component with a width breakpoint - sidebar + aside above ~900dp, tabs below - would let one codebase serve all three.
- NOT PORTED / DEAD CODE spotted in this batch: ActivityHeatmap.tsx (full GitHub-style year grid, hits /api/admin/operations/activity-logs/heatmap) is imported by nothing; the login page declares and renders an `error` state block that is never set; MeetingCard builds entityHref with a double slash ('/admin//operations/...'); manifest.ts and sw-register.tsx are PWA-only and should be dropped (their three shortcuts - Leads, Clients, Meetings - map nicely onto Android app shortcuts if wanted); /api/admin/operations/activity-logs/meta is already flagged broken and unused in the backend plan.
