# Calabrese Interattivo

A lightweight collaborative planning calendar built with **Next.js + TypeScript + Tailwind + shadcn-style UI + Supabase**.

It helps groups quickly decide the best dates for:
- vacations and weekend trips
- dinners and birthdays
- study sessions
- project meetings
- rehearsals and other shared activities

## MVP Features

- Create a planning board and share its link
- Join a board with just a display name (no auth required in v1)
- Monthly calendar with collaborative availability counts per day
- Per-day modal to set **Available / Maybe / Unavailable** and optional notes
- Date-range marking for multi-day planning
- Participant preference fields (destinations, budget, constraints, notes)
- Best-dates summary (single-day ties + simple best 3/5/7-day suggestions)
- Supabase Realtime updates on the current board page
- Polling fallback every 15s

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style component structure (`components/ui/*`)
- Supabase (`@supabase/supabase-js`)

## Project Structure

- `app/page.tsx`
- `app/board/[boardId]/page.tsx`
- `components/BoardHeader.tsx`
- `components/CalendarGrid.tsx`
- `components/DayCell.tsx`
- `components/DayDetailsModal.tsx`
- `components/ParticipantNameForm.tsx`
- `components/ParticipantPreferencesForm.tsx`
- `components/ShareLinkButton.tsx`
- `components/BestDatesSummary.tsx`
- `components/DateRangeSelector.tsx`
- `lib/supabase/client.ts`
- `lib/types.ts`
- `lib/calendar.ts`
- `lib/board.ts`
- `lib/availability.ts`
- `supabase/schema.sql`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy env file and set values:

```bash
cp .env.example .env.local
```

Set:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

3. Run development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project (Free tier is enough).
2. In Supabase dashboard, open **SQL Editor**.
3. Paste and run the full SQL from:

- `supabase/schema.sql`

This creates tables, constraints, indexes, `updated_at` trigger, and MVP RLS policies.

> ⚠️ RLS is intentionally open for MVP anonymous collaboration. Tighten policies before production.

## Build and Lint

```bash
npm run lint
npm run build
```

## Deployment

This repository is structured to deploy easily on Vercel:
- connect GitHub repo
- configure env vars in Vercel project settings
- deploy

## Future Extensibility

The codebase is kept modular so you can later add:
- authentication and private boards
- owner/admin roles
- time slots
- comments/threads
- destination voting and budgeting tools
- calendar export and notifications
