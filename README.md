# Job Application Tracker (Frontend)

Next.js frontend for the [Job Application Tracker API](https://github.com/sNirajan/Job-Application-Tracker).

**Live:** https://job-application-tracker-frontend-eight.vercel.app

## Features

- Dashboard with pipeline stats, conversion rates, weekly activity, and a "Needs your attention" panel for reminders and quiet applications
- Applications as a list (search, filter, sort) or a drag-and-drop board with one column per stage
- Board moves follow the backend's stage rules, work with mouse, touch and keyboard, and can include a note
- Application page with editing, timeline, reminders, contacts, and document uploads with in-app PDF preview

## Tech Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, React Hook Form + Zod, dnd-kit, lucide-react.

## How it talks to the API

In production the browser only talks to this site. Requests to `/api/*` are forwarded to the backend by a Next.js rewrite (`next.config.ts`), so:

- the page and API share one HTTPS origin, so there is no mixed content and no CORS
- login cookies are first-party, so they work in every browser, including Safari

Auth uses HttpOnly cookies. `lib/api.ts` refreshes an expired session automatically, and parallel requests share a single refresh, because refresh tokens are single-use.

## Environment Variables

| Variable | Where | Example | Purpose |
| --- | --- | --- | --- |
| `API_PROXY_TARGET` | Vercel (production) | `http://my-alb.us-east-2.elb.amazonaws.com` | Backend address that `/api/*` is forwarded to |
| `NEXT_PUBLIC_API_URL` | Local only (`.env.local`) | `http://localhost:3001` | Call the backend directly in development. Leave unset in production |

## Running Locally

Start the backend first (see its README), then:

Create `.env.local` containing:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Then:

```bash
npm install
npm run dev
```

Open http://localhost:3000.
