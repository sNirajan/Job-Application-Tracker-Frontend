# Product

## Register

product

(The landing page at `/` is the one brand surface and is polished to the same standard; everything behind login is product.)

## Users

One person running their own job search, mostly a developer applying to engineering roles. They open the app in short bursts: after submitting an application, after a recruiter call, or on a Sunday evening to see where things stand. They are often tired, sometimes discouraged, and rarely in the app for more than a few minutes at a time. Secondary audience: interviewers looking at the live site as a portfolio piece, who will judge craft in the first ten seconds.

## Product Purpose

Keep every job application, its stage, its history, its contacts, its reminders and the exact resume that was sent in one place, so the user always knows what to do next and never has to reconstruct what happened from memory or email. Success is the user opening the dashboard and immediately seeing two things: how the search is going, and what needs attention today.

## Brand Personality

Calm, focused, quietly confident. The interface stays out of the way: plain language, no exclamation marks, no celebration confetti, no pressure. Rejection is shown as neutral information, never as failure. Voice is direct and human ("No update in 9 days", not "Action required").

## Anti-references

- Generic AI-made site: endless identical rounded cards, tiny uppercase tracked eyebrows above every section, gradient text, glassmorphism, ghost cards (1px border plus a wide soft shadow), over-rounded corners.
- Template SaaS dashboards: purple gradients, hero metric walls, icon-stuffed sidebars.
- Cluttered job boards (LinkedIn, Indeed): banner-heavy, dense, competing calls to action.

## Design Principles

1. **Readable before pretty.** Every value that fails contrast gets fixed, even when the lighter version looks more elegant.
2. **One job per screen.** Dashboard answers "how is it going"; applications answers "what do I have"; the job page answers "what happened with this one". Nothing competes with that answer.
3. **Say the state plainly.** Stages, dates, counts and errors in plain words, no jargon, no decoration standing in for information.
4. **Cards only when they are a real affordance.** Board cards are draggable objects, so they are cards. Detail sections are not; they can be structure and space instead of boxes inside boxes.
5. **Quiet by default, loud only for what needs action.** Overdue reminders and destructive actions are the only places allowed to raise their voice.

## Accessibility & Inclusion

- WCAG 2.2 AA: body text at least 4.5:1, large and bold text at least 3:1, non-text UI and focus indicators at least 3:1.
- Visible focus for every interactive element, including board cards and the drop zones.
- The board is fully keyboard operable (Space to pick up, arrows to change column, Escape to cancel) and announces moves to screen readers; that must keep working.
- Status must never be carried by colour alone; stage names are always written out.
- All motion respects `prefers-reduced-motion`.
