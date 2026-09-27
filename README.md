# Sakhi Cycle

Sakhi Cycle is a cycle wellness app built in stages with React, TypeScript, Vite, Tailwind CSS, and Supabase. The existing Lovable prototype remains the visual reference: https://sakhi-cycle-companion.lovable.app

## First checkpoint

This starter contains a responsive landing/sign-in screen, Supabase client configuration, and the first private-data schema for profiles, cycle settings, and daily logs. It does not yet implement cycle predictions, dashboard insights, AI, community features, or offline support.

## Run locally

1. Install Node.js and Git if they are not already installed.
2. In this folder, run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key. Never put a `service_role` or secret key in a `VITE_` variable or browser code.
4. In Supabase, open the SQL Editor and run `supabase/migrations/202609270001_initial_schema.sql`.
5. In Supabase Authentication settings, enable email sign-in and configure the local redirect URL `http://localhost:5173`.
6. Run `npm run dev` and open the local URL Vite prints.

See [PLATFORM_SETUP.md](./PLATFORM_SETUP.md) for connecting GitHub, Supabase, Vercel, and the planned Render role.

Until Supabase credentials are supplied, the app shows a setup note. The login flow uses email magic links.

## Build order

1. Preserve the Lovable prototype as reference and finish the project foundation.
2. Connect Supabase and configure Auth.
3. Review the schema and RLS policies against the product requirements.
4. Add cycle tracking and daily logs.
5. Add dashboard and insights.
6. Add Gemini through a Supabase Edge Function; keep the Gemini secret server-side.
7. Add remaining modules, then PWA/offline behavior.
8. Verify the complete flow, connect GitHub, and deploy to Vercel.

## Data privacy

Cycle settings and daily logs are sensitive health information. The migration enables row-level security so authenticated users can access only their own rows. Review and test database policies before using real personal data. Do not store credentials in source control.
