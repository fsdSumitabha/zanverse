# ZAN Mobile (zanverse)

React Native app for ZAN Services staff. It is the mobile client of the CRM. The backend is the deployed Next.js web
app. Its source is the repo `github.com/fsdSumitabha/zan-workspace`. That source is the read-only reference for every
screen.

@docs/OVERVIEW.md
@docs/CODING_STYLE.md

## How to write to me
- Write in plain English. Short sentences. One idea each. No nested clauses.
- No idioms. No metaphors. No figures of speech. Say the literal thing.
- Use common words. Keep technical terms exact.
- Put the conclusion in the first line. Then the reason.
- For code review: verdict first (safe / bug / risky). Then why. Then the fix.

## Every session
1. The overview above explains the whole app. You build ONE session's scope — its prompt is in `prompts/`.
2. Read the web app source at `reference/zan-workspace` (branch `main`) to see how a screen behaves today. It is
   read-only. If that folder is missing, clone it first:
   `git clone --depth 1 https://github.com/fsdSumitabha/zan-workspace reference/zan-workspace`.
   The folder is gitignored, so it never enters this repo.
3. Keep behaviour the same as the web where the spec doesn't say otherwise: same endpoints, same status codes, same
   role rules, same messages. The phone changes the layout, not the rules.
4. Reference docs live in `docs/`. Read the section you need rather than the whole file.
5. Build and run on the Android emulator or a device, and check the screens you touched.
6. When every item in the session's Definition of Done is true, write a short summary and stop. If something blocks
   you, say what it is and stop there.
7. I review and commit the changes myself.

## Commands
<!-- filled in during session 1 -->
- `npm start` — Metro
- `npm run android` — build and run on Android
- `npm run lint`
- `npm test`
