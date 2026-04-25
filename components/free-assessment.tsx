"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CBC_SUBJECTS, type CbcSubject } from "@/lib/domain";
import { KENYA60_PREVIEW_QUESTIONS } from "@/lib/kenya60-assessment";
import { buildCbcPreviewPack, type PreviewQuestion } from "@/lib/seed-data";

type Track = "cbc" | "ke60";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickKenya60Pack(count: number): PreviewQuestion[] {
  return shuffle(KENYA60_PREVIEW_QUESTIONS).slice(0, count);
}

export function FreeAssessment() {
  const [grade, setGrade] = useState(7);
  const [track, setTrack] = useState<Track>("cbc");
  const [subject, setSubject] = useState<CbcSubject>("Mathematics");

  const [questions, setQuestions] = useState<PreviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"setup" | "quiz" | "results">("setup");

  const active = questions[index];
  const answeredCount = useMemo(
    () => questions.filter((q) => Boolean(answers[q.id])).length,
    [questions, answers],
  );

  const score = useMemo(() => {
    if (questions.length === 0) return 0;
    const correct = questions.filter((q) => answers[q.id] === q.answer).length;
    return Math.round((correct / questions.length) * 100);
  }, [questions, answers]);

  function start() {
    const pack =
      track === "ke60" ? pickKenya60Pack(5) : buildCbcPreviewPack({ grade, subject, count: 5 });

    setQuestions(pack);
    setAnswers({});
    setIndex(0);
    setPhase("quiz");
  }

  function reset() {
    setQuestions([]);
    setAnswers({});
    setIndex(0);
    setPhase("setup");
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Try a free 5-question preview</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          Pick a grade and subject (or try our Kenya@60 family pack). At the end, sign up to save progress and unlock full
          quizzes, teacher assignments, and parent insights.
        </p>
      </div>

      {phase === "setup" && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-800">Grade</span>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              value={grade}
              onChange={(event) => setGrade(Number(event.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-800">Track</span>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              value={track}
              onChange={(event) => setTrack(event.target.value as Track)}
            >
              <option value="cbc">CBC subjects</option>
              <option value="ke60">Kenya@60 (family pack)</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-800">Subject</span>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-100"
              value={subject}
              disabled={track === "ke60"}
              onChange={(event) => setSubject(event.target.value as CbcSubject)}
            >
              {CBC_SUBJECTS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {track === "ke60" && (
              <p className="text-xs text-slate-500">Kenya@60 uses a fixed general-knowledge pack (not tied to a subject).</p>
            )}
          </label>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={start}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 sm:w-auto"
            >
              Start preview
            </button>
          </div>
        </div>
      )}

      {phase === "quiz" && active && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              {track === "ke60" ? "Kenya@60 preview" : `Grade ${grade} • ${subject}`}
            </span>
            <span>
              Question {index + 1} of {questions.length}
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-emerald-600 transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>

          <p className="text-base font-medium text-slate-900">{active.question}</p>

          <div className="space-y-2">
            {active.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [active.id]: option }))}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                  answers[active.id] === option
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Answered {answeredCount}/{questions.length}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                disabled={index === 0}
                onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
              >
                Back
              </button>
              {index < questions.length - 1 ? (
                <button
                  type="button"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                  onClick={() => setIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                  disabled={answeredCount === 0}
                  onClick={() => setPhase("results")}
                >
                  See results
                </button>
              )}
            </div>
          </div>

          <button type="button" onClick={reset} className="text-xs font-medium text-slate-500 underline">
            Cancel preview
          </button>
        </div>
      )}

      {phase === "results" && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-900">Preview score</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{score}%</p>
            <p className="mt-2 text-sm text-emerald-900">
              Create an account to save your attempts, unlock full quiz sessions, and sync teacher/parent dashboards.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Register to continue
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-800/30 bg-white px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-100"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Review</h3>
            {questions.map((q) => {
              const picked = answers[q.id];
              const correct = picked === q.answer;
              return (
                <article
                  key={q.id}
                  className={`rounded-2xl border p-4 text-sm ${
                    correct ? "border-emerald-200 bg-white" : "border-red-200 bg-red-50"
                  }`}
                >
                  <p className="font-medium text-slate-900">{q.question}</p>
                  <p className="mt-2 text-slate-700">Your answer: {picked || "—"}</p>
                  {!correct && <p className="text-slate-700">Correct answer: {q.answer}</p>}
                  <p className="mt-2 text-slate-600">{q.explanation}</p>
                </article>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={start} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
              Try another preview
            </button>
            <button type="button" onClick={reset} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Back to setup
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
