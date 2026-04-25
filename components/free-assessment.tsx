"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { getSubjectsForGrade, type CbcSubject } from "@/lib/domain";
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

  const gradeSubjects = useMemo(() => getSubjectsForGrade(grade), [grade]);
  const selectedSubject = gradeSubjects.includes(subject) ? subject : gradeSubjects[0] ?? "Mathematics";

  function start() {
    const pack =
      track === "ke60"
        ? pickKenya60Pack(5)
        : buildCbcPreviewPack({ grade, subject: selectedSubject, count: 5 });

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
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-5 text-white lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Free assessment</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">Try a free 5-question preview</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-emerald-50 lg:text-base">
          Choose Grade 1-12 and subject, or switch to Kenya@60 for general family questions. After your score, sign in
          to continue with full quizzes and progress tracking.
        </p>
      </div>

      {phase === "setup" && (
        <div className="grid gap-8 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1 - Grade</p>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      grade === g
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 2 - Track</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTrack("cbc")}
                  className={`rounded-xl border px-4 py-3 text-left text-sm ${
                    track === "cbc"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                  }`}
                >
                  <p className="font-semibold">CBC subjects</p>
                  <p className="mt-1 text-xs text-slate-500">Maths, English, Science and more</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTrack("ke60")}
                  className={`rounded-xl border px-4 py-3 text-left text-sm ${
                    track === "ke60"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                  }`}
                >
                  <p className="font-semibold">Kenya@60 family pack</p>
                  <p className="mt-1 text-xs text-slate-500">General questions for parents and learners</p>
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 3 - Subject</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {gradeSubjects.map((name) => (
                  <button
                    key={name}
                    type="button"
                    disabled={track === "ke60"}
                    onClick={() => setSubject(name)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      track === "ke60"
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : selectedSubject === name
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {track === "ke60" && (
                <p className="mt-2 text-xs text-slate-500">Kenya@60 uses a fixed general-knowledge set.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:p-6">
            <h3 className="text-base font-semibold text-slate-900">Ready to start?</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>5 questions with instant scoring</li>
              <li>Preview is free with no account needed</li>
              <li>Continue after sign in or registration</li>
            </ul>
            <button
              type="button"
              onClick={start}
              className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Start assessment
            </button>
            <p className="mt-2 text-xs text-slate-500">
              Grade {grade} {track === "cbc" ? `- ${selectedSubject}` : "- Kenya@60"}
            </p>
          </div>
        </div>
      )}

      {phase === "quiz" && active && (
        <div className="space-y-5 p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              {track === "ke60" ? "Kenya@60 preview" : `Grade ${grade} - ${selectedSubject}`}
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

          <div className="grid gap-2 sm:grid-cols-2">
            {active.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [active.id]: option }))}
                className={`rounded-xl border px-4 py-3 text-left text-sm ${
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
        <div className="space-y-6 p-6 lg:p-8">
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
            <div className="grid gap-3 lg:grid-cols-2">
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
