# Design notes — LeadsAgri Partner Bootcamp Tracker

Direction tried: 21st.dev/shadcn-style (Nuxt UI v4, zinc neutrals, green primary),
Inter Variable self-hosted. Mixed brief — auth page is expressive (split brand
panel + centered card), dashboard is convention mode (sticky summary + numbered
session rail with green check bubbles).

Signature element: the numbered session rail (green-filled check bubbles per
completed session) + big tabular-nums progress %.

What to avoid repeating: inline JSON bodies through PowerShell→curl (quoting
mangles them — use @file), and `v-else` directly after a `<template #slot v-if>`
in Vue (must move the condition inside the slot).

Open threads: SMTP creds not yet provided (Zoho app password pending) — until
then dev mode shows the OTP on screen and logs it to the console.
