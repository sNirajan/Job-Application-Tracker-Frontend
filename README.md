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

## Project layout

```
app/
  page.tsx              landing page
  login, register       auth screens
  dashboard/            stats, plus the follow-ups panel
  applications/
    page.tsx            list and board views, search, sort, filters
    ApplicationsBoard   drag-and-drop board
    [id]/               one application: details, timeline, reminders,
                        contacts, documents, PDF preview
components/AppNav       the signed-in header, shared by every screen
lib/
  api.ts                fetch wrapper: cookies, session refresh, uploads
  statusMachine.ts      mirror of the backend stage rules (server decides)
  ui.ts                 shared styles: fields, buttons, badges, sections
  types.ts              shared API types
app/globals.css         design tokens and component classes
```

## Design and accessibility

Colour, spacing, radius and motion live as tokens in `app/globals.css`, and
buttons and fields are classes there rather than inline styles, so every screen
shares one set of hover, focus, active and disabled states.

The bar is WCAG 2.2 AA, and the values were measured rather than eyeballed:

- Body text is at least 4.5:1 on every surface it appears on, large text 3:1
- Form control borders are at least 3:1, so the edge of an input is visible
- Every interactive element has a visible focus ring, including board cards
- Stage colour carries meaning (green is a good outcome, neutral is closed) and
  is never the only signal, since the stage name is always written out
- All motion is disabled under `prefers-reduced-motion`

The board works with a mouse, touch, or the keyboard alone (Space to pick up,
left and right arrows to change column, Escape to cancel), and announces each
move to screen readers.

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
