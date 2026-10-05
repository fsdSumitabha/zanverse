# Session prompts

One file per session, in order. **Open the file, copy everything below its title line, paste it into a new session in
`D:\zanverse`.** Nothing else is needed — each prompt is self-contained.

## How a session runs

- **One session per file.** Start a fresh session for each; don't continue a finished one.
- **Each prompt ends itself.** Every file has a Definition of Done. When those items are true, the session writes a
  summary and stops. That is the rule that keeps a session from drifting into "what next?" forever.
- **Some files have a second prompt** under `--- FOLLOW-UP ---`. Paste it only if the first part stops early or the
  file says to.
- **You commit.** Sessions leave changes in the working tree and summarize them; review and commit yourself.
- **Blocked is a valid ending.** If a session reports a blocker (a missing backend change, a package that won't build),
  fix that first; don't push the session to work around it.

## Before you start

1. `docs/BACKEND_CHANGES.md` lists five small changes to the web API. **Session 4 and everything after it is blocked
   until they are live on the dev API.** Sessions 1–3 can run before that.
2. Put the dev API base URL in `.env` as session 1 sets up (`API_BASE_URL`).
3. Have an Android emulator or a device with USB debugging ready.

## The sessions

| # | File | What it delivers | Size |
|---|---|---|---|
| 1 | `session-01-native-spike.md` | The native stack proven on RN 0.87 and versions locked | M |
| 2 | `session-02-shared-core.md` | Constants, types and pure helpers copied from the web | M |
| 3 | `session-03-design-system.md` | Buttons, cards, pills, inputs, sheets, skeletons | M |
| 4 | `session-04-api-auth-region.md` | API client, login, token storage, region header | L |
| 5 | `session-05-navigation.md` | Tabs, stacks, role-filtered menu, splash | M |
| 6 | `session-06-list-kit.md` | The list pattern every module reuses | M |
| 7 | `session-07-leads.md` | Leads: list, create, detail, edit, convert | L |
| 8 | `session-08-timeline.md` | The interaction timeline and its entry forms | L |
| 9 | `session-09-clients.md` | Clients and their projects | M |
| 10 | `session-10-projects.md` | Projects | M |
| 11 | `session-11-lead-sources-list.md` | Cold-calling list and Today view | L |
| 12 | `session-12-lead-sources-dialing.md` | Real dialing, detail, convert to lead | M |
| 13 | `session-13-lead-sources-uploads.md` | Sheet upload, reports, downloads | L |
| 14 | `session-14-meetings.md` | Meetings and their actions | M |
| 15 | `session-15-notifications.md` | Inbox, badge, polling | M |
| 16 | `session-16-users.md` | Staff directory and user forms | M |
| 17 | `session-17-profile.md` | Own profile, avatar, password | S |
| 18 | `session-18-activity-logs.md` | Audit feed and heatmap | M |
| 19 | `session-19-dashboard-search.md` | Dashboard feed, stats panels, search | M |
| 20 | `session-20-stats-charts.md` | Overall stats with charts | M |
| 21 | `session-21-polish.md` | Bottom sheets, caching, offline, Sentry | M |
| 22 | `session-22-android-release.md` | Signed release build | M |
| 23 | `session-23-push.md` | Push notifications for due callbacks | L |
| 24 | `session-24-ios-windows.md` | iOS build and the Windows decision | M |

## Decisions recorded as you go

Session 1 settles the NativeWind version; write the outcome into `docs/OVERVIEW.md` §3 so later sessions don't
re-open it. The same goes for any decision from §10 you make along the way.
