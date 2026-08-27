# Odoo Bootcamp Tracker

A Nuxt 4 + Nuxt UI application that tracks a partner's progress through the
[Odoo Partner Bootcamp](https://www.odoo.com/slides/partner-bootcamp-462) curriculum.

## Flow

1. Only **admin accounts** sign in: `marcelus@blueframeph.com`,
   `kmacabos@leadsagri.com`, `aaraza@leadsagri.com`.
2. Enter your name and admin email on the sign-in page. Check
   **Remember this device** to stay signed in for 30 days; otherwise the
   session ends when the browser closes.
3. You land on the **dashboard**: overall progress
   (team average derived from the member progress card), per-section session
   tables with XP, and completion checkboxes.
4. Tick each session off as it's completed — progress is saved automatically.
5. Team members appear in the assign list; assign them to sessions to track
   who has completed each one.

## Stack

- **Nuxt 4** (app/ directory, Nitro server routes)
- **Nuxt UI v4** (Tailwind CSS v4, Reka UI) — 21st.dev-style components
- **Nitro fs storage** (`.data/`) for sessions and progress — no database needed

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command             | Description                     |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the dev server            |
| `npm run build`     | Production build                |
| `npm run preview`   | Preview the production build    |
| `npm run lint`      | ESLint                          |
| `npm run typecheck` | Vue TS + Nuxt type checking     |

## Project structure

```
app/
  pages/index.vue        # Sign-in page (email + password + remember me)
  pages/dashboard.vue    # Progress tracker
  components/AppLogo.vue
shared/sessions.ts       # Bootcamp curriculum (sections, sessions)
server/
  api/auth/              # Login, session, logout
  api/assignments/       # Member assignment read/update
  api/progress/          # Progress read/toggle
  utils/                 # Session, progress, assignment helpers
.data/                   # Runtime storage (gitignored)
```

## Notes

- Session cookie is httpOnly, sameSite=lax, and `secure` outside dev.
- "Remember this device" sets a 30-day cookie; without it the session ends
  when the browser closes.
- Members are registered on first sign-in and can be assigned to any session.
  Assigning a member to a session counts it for them immediately (e.g. 1/27);
  the Done checkbox tracks the overall progress card only.
- Team members are seeded on server start (see
  `server/plugins/seed-members.ts`) and appear in the assign list immediately;
  admin login accounts are excluded from the member list.
- The curriculum (27 sessions, 4 sections) mirrors the official
  Odoo Partner Bootcamp course content.
