# Connect Sakhi Cycle's platforms

The project is prepared for these responsibilities:

| Platform | Role |
| --- | --- |
| GitHub | Source repository and build checks on pushes and pull requests |
| Supabase | PostgreSQL, email authentication, row-level security, and later Edge Functions/Storage |
| Vercel | Production and preview hosting for the Vite website, deployed from GitHub |
| Render | Future scheduled jobs or background workers when Sakhi Cycle has a specific job to run |

Render is intentionally not configured as a second copy of the website. There is no worker or scheduled task in the current MVP, so creating a Render service now would add a deployment without a useful process to run.

## 1. Push this project to GitHub

Create a **private, empty** repository named `sakhi-cycle` on GitHub. Do not initialize it with a README, license, or `.gitignore` because those files are already in this project.

From the project folder, run the following, replacing `YOUR-USERNAME` with your GitHub username:

```bash
git branch -M main
git add -A
git commit -m "Start Sakhi Cycle app"
git remote add origin https://github.com/YOUR-USERNAME/sakhi-cycle.git
git push -u origin main
```

The repository includes a GitHub Actions workflow that installs the locked npm dependencies and builds the app on pushes to `main` and pull requests. Never commit `.env.local` or any secret keys.

## 2. Connect Supabase

1. Create a Supabase project and keep its database password private.
2. In the Supabase SQL Editor, run `supabase/migrations/202609270001_initial_schema.sql`.
3. In Authentication, enable email sign-in. The app uses email magic links.
4. Copy the project URL and **publishable key** into `.env.local` for local development. Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as the variable names.
5. Do not use a `service_role` key or secret key in the browser, `.env.local` checked into Git, or any `VITE_` variable.

The migration stores profile, cycle settings, and daily logs. It enables row-level security and limits each account to its own rows. The profile trigger helper is in a non-exposed schema and cannot be called directly through the public API.

## 3. Connect Vercel to GitHub

1. In Vercel, import the `sakhi-cycle` GitHub repository.
2. Keep the project root at the repository root. Vercel should detect Vite; use `npm run build` as the build command and `dist` as the output directory.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under the Vercel project's environment variables for Preview and Production.
4. Deploy a preview, then add the Vercel deployment URL to Supabase Authentication's allowed redirect URLs. Also keep `http://localhost:5173` for local sign-in.
5. Vercel will create preview deployments from branches/pull requests and production deployments from the configured production branch.

## 4. Add Render when a background job exists

When a real scheduled task or queue consumer is defined (for example, a user-requested reminder processor), add it as a separate Render Cron Job or Worker deployed from this same GitHub repository. Keep its credentials in Render's secret environment variables. Do not copy the Gemini secret or Supabase service-role secret into client-side Vite variables.

At that point, create and validate `render.yaml` for the concrete job and choose the required schedule/worker process. Until then, the website and Supabase Edge Functions remain on the selected Vercel + Supabase architecture.
