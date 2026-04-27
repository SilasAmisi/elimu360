## Elimu360

AI-powered curriculum-aligned learning platform for Kenyan primary and secondary students.

This repository currently implements the critical backend path:

- Clerk auth scaffolding (roles + plan mirrored into DB)
- Neon Postgres schema + migration runner
- Hardcoded CBC seed data for Grades 7-12 (12 subjects, 10 questions each)
- Quiz API route with:
  - free plan -> hardcoded questions
  - premium plan -> AI (gpt-4o-mini) with 30-day cache in `questions`

## Getting Started

1) Copy env vars:

```bash
cp .env.example .env.local
```

2) Fill:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWKS_URL`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `OPENAI_API_KEY` (required for premium AI generation)

3) Run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

4) Start development server:

```bash
npm run dev
```

5) Create Clerk webhook endpoint:

- URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`

The webhook calls `syncUser` to upsert users into the `users` table with `role` and `plan` from Clerk `publicMetadata`.

## Quiz API

`POST /api/quiz`

Request body:

```json
{
  "grade": 8,
  "subjectId": 12
}
```

Response:

- `source: "hardcoded"` when 10 hardcoded items exist for that grade/subject
- `source: "mixed-cache"` / `mixed-fresh` when hardcoded is topped up from cached or new AI rows
- `source: "ai-fresh"` when only AI items are available
- `source: "limited"` when fewer than 10 questions exist and AI generation is blocked or fails (see `warning`)
- AI rows are cached in `questions` for 30 days; new generation is rate-limited via `ai_usage_guardrails`

`POST /api/quiz/submit`

Saves student attempt, computes score server-side, stores quiz history, and updates `progress`.

`GET /api/student/subjects?grade=7`

Returns available subjects for a grade.

`GET /api/student/progress`

Returns recent quiz history, per-subject progress, and weak subject flags.

## Student Portal

Visit `/student` after signing in to:

- select grade and subject
- take one-question-at-a-time quizzes
- view result breakdown with explanations
- view recent quiz attempts and weak subjects

## Teacher Panel

Visit `/teacher` (teacher/admin role) to:

- create classes and share class codes
- assign quizzes by class, subject, grade, and due date
- review per-student class results and weak-area signals

Teacher API routes:

- `GET/POST /api/teacher/classes`
- `GET/POST /api/teacher/assignments?classCode=...`

Student class join route:

- `POST /api/student/classes/join` with `{ "classCode": "ELM-XXXXXX" }`

## Parent Dashboard

Visit `/parent` (parent/admin role) to:

- link one or more children using student IDs
- view each child&apos;s recent quiz history
- view weak subjects and suggested focus areas

Parent API routes:

- `POST /api/parent/children/link`
- `GET /api/parent/dashboard`

## Admin Panel

Visit `/admin` (admin role only) to:

- view all users, roles, and plan status
- see platform usage stats (quizzes, active users, popular subjects)
- add/edit hardcoded questions by grade and subject

Admin API routes:

- `GET /api/admin/overview`
- `GET/POST/PATCH /api/admin/questions`

## Phase 9 Polish

- Global loading, error, and not-found experiences are configured in `app/loading.tsx`, `app/error.tsx`, and `app/not-found.tsx`.
- Route-level loading states are configured for student, teacher, parent, and admin screens.
- Deployment and role-based smoke tests are documented in `docs/smoke-test-checklist.md`.

## Deploy (Vercel)

`npm run build` runs migration + seed before Next build:

```bash
npm run db:migrate && npm run db:seed && next build
```
