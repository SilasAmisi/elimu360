# Elimu360 Smoke Test Checklist

Run this checklist on staging or production after deployment.

## Prerequisites

- Migrations executed (`npm run db:migrate`)
- Seed data executed (`npm run db:seed`)
- Clerk webhook configured for `user.created` and `user.updated`
- Test accounts exist for:
  - student
  - teacher
  - parent
  - admin

## Student Flow

- Sign in as student and open `/student`.
- Select grade and subject, start a quiz, answer questions, submit.
- Confirm score and explanations render.
- Confirm `/api/student/progress` reflects the new attempt.

## Teacher Flow

- Sign in as teacher and open `/teacher`.
- Create a class and copy class code.
- Create at least one assignment with due date.
- Confirm assignment appears in class list.
- Confirm class results section loads without errors.

## Parent Flow

- Sign in as parent and open `/parent`.
- Link a student by student ID.
- Confirm child card appears with quiz history and weak subjects.

## Admin Flow

- Sign in as admin and open `/admin`.
- Confirm user table, stats, and popular subjects load.
- Add a hardcoded question for a subject and grade.
- Edit an existing hardcoded question and verify update succeeds.

## API Spot Checks

- `POST /api/quiz`
- `POST /api/quiz/submit`
- `GET /api/student/progress`
- `GET /api/teacher/classes`
- `GET /api/parent/dashboard`
- `GET /api/admin/overview`

## Mobile/UX Checks

- Validate layout at ~360px width on `/student`, `/teacher`, `/parent`, `/admin`.
- Confirm loading states render during route transitions.
- Confirm global error page appears if an unhandled runtime error is thrown.
