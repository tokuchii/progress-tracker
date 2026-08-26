# LeadsAgri Partner Bootcamp Tracker

A Nuxt 4 + Nuxt UI application that tracks a partner's progress through the
[Odoo Partner Bootcamp](https://www.odoo.com/slides/partner-bootcamp-462) curriculum.

## Flow

1. Enter **name + @leadsagri.com email** on the landing page.
2. A **6-digit OTP** is emailed to that address (5-minute expiry, 5 attempts).
3. On verification, the user lands on the **dashboard**: overall progress bar,
   per-section sessions with XP badges, and completion checkboxes.
4. Sessions that produce deliverables have an optional **Upload output** button —
   files are stored per user and can be downloaded or replaced.

## Stack

- **Nuxt 4** (app/ directory, Nitro server routes)
- **Nuxt UI v4** (Tailwind CSS v4, Reka UI) — 21st.dev-style components
- **nodemailer** for OTP emails
- **Nitro fs storage** (`.data/`) for OTPs, sessions, progress, and uploads — no database needed

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Sending OTP emails via Zoho Mail

Copy `.env.example` to `.env` and fill in your credentials:

```env
NUXT_SMTP_HOST=smtp.zoho.com
NUXT_SMTP_PORT=587
NUXT_SMTP_SECURE=false
NUXT_SMTP_USER=no-reply@leadsagri.com
NUXT_SMTP_PASS=your-app-password
NUXT_SMTP_FROM=LeadsAgri Bootcamp <no-reply@leadsagri.com>
```

Zoho Mail requires an **app-specific password** (not your login password).
Create one in Zoho Mail under *Settings > Mail Accounts > Security > App Passwords*,
then paste it into `NUXT_SMTP_PASS`. Port 587 with TLS (`secure=false`) is the
recommended setup; use port 465 with `NUXT_SMTP_SECURE=true` if your network
blocks 587.

**Without SMTP configured** the server logs the code to the console
(`[otp] user@leadsagri.com: 123456`), and in dev mode the code is also shown
on the OTP screen so the flow can be tested end to end.

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
  pages/index.vue        # Name + email → OTP flow
  pages/dashboard.vue    # Progress tracker
  components/AppLogo.vue
shared/sessions.ts       # Bootcamp curriculum (sections, sessions, upload points)
server/
  api/auth/              # OTP request, verify, session, logout
  api/progress/          # Progress read/toggle, upload, download, delete
  utils/                 # Session, OTP, progress, mail helpers
.data/                   # Runtime storage (gitignored)
```

## Notes

- OTPs are hashed (SHA-256) before storage and expire after 5 minutes.
- Session cookie is httpOnly, sameSite=lax, and `secure` outside dev.
- Uploads are limited to 10 MB per file.
- The curriculum (27 sessions, 4 sections) mirrors the official
  Odoo Partner Bootcamp course content.
