# Design notes — Odoo Bootcamp Tracker

Direction: 21st.dev/shadcn-style (Nuxt UI v4, zinc neutrals, green primary),
Inter Variable self-hosted. Mixed brief — auth page is expressive (split brand
panel + centered card), dashboard is convention mode (sticky summary + numbered
session rail with green check bubbles). Branding: generic Odoo Bootcamp
Tracker (rocket tile + wordmark), no company-specific branding. Polish pass:
soft gradient glows on the summary card, animated progress-ring fills, hover
states on rows and chips.

Signature element: the numbered session rail (green-filled check bubbles per
completed session) + big tabular-nums progress %.

What to avoid repeating: inline JSON bodies through PowerShell→curl (quoting
mangles them — use @file), and `v-else` directly after a `<template #slot v-if>`
in Vue (must move the condition inside the slot).

Auth: name + email sign-in (admin emails only, no password) with a
"remember this device" option — 30-day cookie when checked, browser-session
cookie otherwise. Notifications use an iPhone-style top banner (glass blur,
spring slide-down, auto-dismiss).
