# StudySplit

**Fair task splits for group projects — and one click to survive a flaky teammate.**

## a. What it does, and the problem it solves

Every student has been in a group project where the work gets split unfairly, or worse, where one teammate goes quiet halfway through and nobody knows how to redistribute their work without a fight.

**StudySplit** solves both problems for **student groups working on shared assignments** (coursework, capstones, hackathon teams):

1. You paste the assignment description and list your teammates with their strengths and weekly available hours.
2. AI breaks the assignment into concrete, ownable tasks and assigns them fairly — balancing workload against stated availability, not just skill.
3. If a teammate becomes unavailable partway through, you click **"[Name] is unavailable"** and AI instantly redistributes only their unfinished work across the rest of the group, with a plain-English explanation of why it split it that way.

Nothing here is a to-do list clone with an AI wrapper — the specific, memorable feature is the rebalance step: it's built around the exact moment group projects usually fall apart.

## b. Live URL

**[Add your deployed Vercel URL here after deployment]**

`https://studysplit-yourname.vercel.app`

## c. Features

- Create a project from an assignment description + a list of teammates (name, strengths, weekly available hours)
- AI-generated task breakdown: concrete tasks, effort estimates in hours, and a fair initial assignment
- A plain-English rationale explaining *why* the split is fair, shown right on the board
- Kanban board (To do / In progress / Done) with one-click status changes per task
- Per-teammate **load bar** showing assigned hours vs. their stated capacity — the visual heartbeat of the app
- **Signature feature:** "[Name] is unavailable → Rebalance tasks" — AI reassigns only that person's unfinished tasks across the remaining group, respecting current load and strengths, with an explanation
- A short animation showing tasks visibly moving off the unavailable teammate's bar and onto others' during a rebalance
- Multiple projects supported, listed on the home page, deletable
- No login required — projects are saved to your browser (`localStorage`) and openable by URL
- Fully responsive layout, visible keyboard focus states, and respects `prefers-reduced-motion`

## d. The AI feature

StudySplit uses **Google Gemini** (`gemini-2.0-flash`, called server-side from Next.js API routes) for two distinct AI-driven steps. Both use structured JSON output (`responseSchema`) so the model's response plugs directly into the UI without brittle text-parsing.

### 1. Initial task breakdown — system prompt (`lib/gemini.ts`)

```
You are StudySplit's task-planning assistant. Group project members give you an
assignment description and a list of teammates with their strengths and weekly
available hours.

Your job:
1. Break the assignment into concrete, actionable tasks (not vague phases). Each
   task should be something one person can own and finish.
2. Estimate realistic effort in hours for each task, based on the assignment's
   apparent scope.
3. Assign each task to the teammate whose stated strengths best match it, while
   keeping total assigned hours roughly proportional to each person's stated
   weekly availability. Do not give one person everything just because they look
   most skilled — balance load first, then match skill.
4. Write a short, plain-English rationale (2-4 sentences) explaining the overall
   split logic, so the group understands why it's fair.

Be concrete and specific to the assignment text given. Never invent teammates
that were not listed. Every task must be assigned to exactly one of the provided
member IDs.
```

### 2. Rebalance on unavailability — system prompt (`lib/gemini.ts`)

```
You are StudySplit's rebalancing assistant. A member of a group project has just
become unavailable partway through. You must redistribute ONLY that person's
unfinished tasks among the remaining available members.

Rules:
1. Never touch tasks that are already marked "done" — leave them assigned to the
   original owner for the record.
2. Never touch tasks already owned by someone other than the unavailable member.
3. Redistribute the unavailable member's "todo" and "in_progress" tasks across
   the remaining available members.
4. Balance by remaining workload: consider each remaining member's current total
   assigned hours and their stated weekly available hours, so nobody gets
   overloaded. Prefer members with more spare capacity and relevant strengths
   for each specific task.
5. It is fine to split load unevenly if strengths clearly justify it, but always
   explain why in the rationale.
6. Write a short, plain-English rationale (2-4 sentences) a stressed group of
   students would actually find reassuring and clear.

Return which task IDs moved and their new assigneeId. Do not modify task titles,
descriptions or hours.
```

Both prompts and their JSON schemas are in [`lib/gemini.ts`](./lib/gemini.ts); the two API routes that call them are [`app/api/breakdown/route.ts`](./app/api/breakdown/route.ts) and [`app/api/rebalance/route.ts`](./app/api/rebalance/route.ts).

## e. Tools, services, and AI models used

| Purpose | Tool |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS (custom design tokens — see below) |
| AI model | Google Gemini `gemini-2.0-flash` via the Gemini API (free tier) |
| Data storage | Browser `localStorage` — no backend database required to run this project |
| Hosting | Vercel (free Hobby tier) |
| Version control | GitHub |

**Design system:** ivory-sage background, near-navy ink, a teal "workload-balance" accent, and a coral accent reserved for the unavailable/rebalance action. Type pairing is Space Grotesk (display), Inter (body), and IBM Plex Mono (hours, IDs, and data-flavored labels) — chosen to make the app feel like it's literally *accounting for effort*, which is the whole premise of the tool.

**Note on storage:** the app intentionally ships with zero backend database so it deploys with a single environment variable. Swapping `lib/storage.ts` for Supabase (Postgres, free tier) to support multi-device sync and real accounts is a natural next step, noted here rather than built, to keep the deploy simple and reliable for grading.

## f. Screenshots

> Replace these with real screenshots of your deployed app before submitting.
> Suggested shots: (1) the home page / create-project form, (2) the board right
> after the AI generates the first task split with the rationale panel visible,
> (3) a teammate's load bar mid-rebalance or right after, showing tasks having
> moved, (4) the rationale panel explaining a rebalance.

`![Home page](./screenshots/1-home.png)`
`![Initial split](./screenshots/2-initial-split.png)`
`![Rebalance in action](./screenshots/3-rebalance.png)`
`![Rebalance rationale](./screenshots/4-rationale.png)`

## g. How to run the project

### Prerequisites
- Node.js 18+
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Local setup

```bash
git clone https://github.com/YOUR_USERNAME/studysplit.git
cd studysplit
npm install
cp .env.example .env.local
# edit .env.local and paste your Gemini API key into GEMINI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploying to Vercel (free)

1. Push this repo to your own public GitHub account.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and click **Add New → Project**.
3. Import the `studysplit` repo.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = your Gemini API key
5. Click **Deploy**. Vercel gives you a public URL — paste it into section (b) above.

No database setup, no Docker, no paid tier required anywhere in this stack.

## Project structure

```
app/
  page.tsx                  → home page: create project, list projects
  project/[id]/page.tsx     → board page: load bars + kanban + rebalance
  api/breakdown/route.ts    → API route: AI task breakdown
  api/rebalance/route.ts    → API route: AI rebalance
  layout.tsx, globals.css   → app shell, fonts, design tokens
components/
  LoadBar.tsx               → per-teammate workload gauge (signature UI element)
  TaskBoard.tsx             → kanban board
  RationalePanel.tsx        → shows the AI's plain-English reasoning
lib/
  types.ts                  → shared TypeScript data model
  storage.ts                → localStorage persistence
  gemini.ts                 → Gemini API calls + both system prompts
```
