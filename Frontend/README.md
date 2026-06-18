# TrialMatch Frontend

SvelteKit web UI for the TrialMatch patient-to-trial matching dashboard.

## Architecture

- **Entry layout**: [`src/routes/+layout.svelte`](src/routes/+layout.svelte) loads Tailwind CSS and renders the page shell.
- **Main dashboard**: [`src/routes/+page.svelte`](src/routes/+page.svelte) includes the search form, eligibility results, and explanation UI.
- **API base URL**: [`src/lib/config.ts`](src/lib/config.ts) reads `VITE_API_BASE` from the environment. It defaults to the empty string (`''`) which assumes same-origin in production, and is overridden to `http://localhost:3000` in development via `.env`.

## Running

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # production build via @sveltejs/adapter-vercel
```

The backend server must be running on `localhost:3000` for the frontend to reach `/api/match`, `/api/explain`, and `/api/trials`.
