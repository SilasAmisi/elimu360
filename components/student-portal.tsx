"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Subject = {
  id: number;
  name: string;
  grade_level: number;
};

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  difficulty: string;
};

type QuizResult = {
  questionId: number;
  question: string;
  selectedOption: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
};

type ProgressResponse = {
  history: Array<{
    id: number;
    grade: number;
    score: number;
    completed_at: string | null;
    subject: string;
  }>;
  progress: Array<{
    subject: string;
    totalQuizzes: number;
    averageScore: number;
    weakAreas: string[];
  }>;
  weakSubjects: Array<{
    subject: string;
    averageScore: number;
    weakAreas: string[];
  }>;
};

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function StudentPortal() {
  const [grade, setGrade] = useState<number>(7);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [status, setStatus] = useState<"setup" | "loading" | "quiz" | "result">("setup");
  const [error, setError] = useState<string | null>(null);
  const [familyCodeInput, setFamilyCodeInput] = useState("");
  const [familyMessage, setFamilyMessage] = useState<string | null>(null);
  const [familyStatus, setFamilyStatus] = useState<"idle" | "loading">("idle");
  const [quizWarning, setQuizWarning] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<
    Record<number, { isCorrect: boolean; correctAnswer: string; explanation: string }>
  >({});
  const [checkStatus, setCheckStatus] = useState<"idle" | "loading">("idle");
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const activeQuestion = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answers[question.id])).length,
    [questions, answers],
  );
  const feedbackCount = useMemo(() => Object.keys(answerFeedback).length, [answerFeedback]);
  const quizProgress = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.min(1, feedbackCount / questions.length);
  }, [questions.length, feedbackCount]);

  async function loadProgress() {
    const response = await fetch("/api/student/progress");
    const data = (await response.json()) as ProgressResponse & { error?: string };
    if (response.ok) {
      setProgress(data);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchSubjectsForGrade() {
      try {
        const response = await fetch(`/api/student/subjects?grade=${grade}`);
        const data = (await response.json()) as { subjects?: Subject[]; error?: string };
        if (cancelled) return;

        if (!response.ok || !data.subjects) {
          setSubjects([]);
          setSubjectId(null);
          setError(data.error ?? "Failed to load subjects");
          return;
        }

        setError(null);
        setSubjects(data.subjects);
        setSubjectId(data.subjects[0]?.id ?? null);
      } catch {
        if (!cancelled) {
          setSubjects([]);
          setSubjectId(null);
          setError("Failed to load subjects.");
        }
      }
    }

    void fetchSubjectsForGrade();

    return () => {
      cancelled = true;
    };
  }, [grade]);

  useEffect(() => {
    if (!activeQuestion) return;
    if (!answerFeedback[activeQuestion.id]) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeQuestion?.id, answerFeedback]);

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialProgress() {
      try {
        const response = await fetch("/api/student/progress");
        const data = (await response.json()) as ProgressResponse & { error?: string };
        if (!cancelled && response.ok) {
          setProgress(data);
        }
      } catch {
        // Ignore initial progress load failure and keep UI usable.
      }
    }

    void fetchInitialProgress();

    return () => {
      cancelled = true;
    };
  }, []);

  async function redeemFamilyCode() {
    const trimmed = familyCodeInput.trim();
    if (trimmed.length < 4) {
      setFamilyMessage("Enter the code from your parent.");
      return;
    }
    setFamilyStatus("loading");
    setFamilyMessage(null);
    try {
      const response = await fetch("/api/student/redeem-family-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setFamilyMessage(data.error ?? "Could not apply code.");
        setFamilyStatus("idle");
        return;
      }
      setFamilyCodeInput("");
      setFamilyMessage("Code applied. Your parent account is now linked for assessments and progress tracking.");
      setFamilyStatus("idle");
    } catch {
      setFamilyMessage("Could not apply code.");
      setFamilyStatus("idle");
    }
  }

  async function startQuiz() {
    if (!subjectId) return;

    setStatus("loading");
    setError(null);
    setQuizWarning(null);

    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, subjectId }),
    });
    const data = (await response.json()) as {
      questions?: QuizQuestion[];
      warning?: string;
      error?: string;
    };

    if (!response.ok || !data.questions?.length) {
      setStatus("setup");
      setError(data.error ?? "Could not start quiz.");
      return;
    }

    setQuizWarning(typeof data.warning === "string" ? data.warning : null);
    setQuestions(data.questions);
    setAnswers({});
    setAnswerFeedback({});
    setResults([]);
    setScore(null);
    setCurrentIndex(0);
    setStatus("quiz");
  }

  async function evaluateQuestion(question: QuizQuestion) {
    if (!subjectId) return false;
    if (answerFeedback[question.id]) return true;
    const selected = answers[question.id];
    if (!selected) {
      setError("Pick an answer first.");
      return false;
    }
    setCheckStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/quiz/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          subjectId,
          grade,
          selectedOption: selected,
        }),
      });
      const data = (await response.json()) as {
        isCorrect?: boolean;
        correctAnswer?: string;
        explanation?: string;
        error?: string;
      };
      if (!response.ok || typeof data.isCorrect !== "boolean" || !data.correctAnswer || !data.explanation) {
        setError(data.error ?? "Could not check answer.");
        setCheckStatus("idle");
        return false;
      }
      setAnswerFeedback((prev) => ({
        ...prev,
        [question.id]: {
          isCorrect: data.isCorrect!,
          correctAnswer: data.correctAnswer!,
          explanation: data.explanation!,
        },
      }));
      return true;
    } catch {
      setError("Could not check answer.");
      return false;
    } finally {
      setCheckStatus("idle");
    }
  }

  async function handleQuizPrimaryAction() {
    if (!activeQuestion) return;
    const fb = answerFeedback[activeQuestion.id];
    if (!fb) {
      await evaluateQuestion(activeQuestion);
      return;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      return;
    }
    await submitQuiz();
  }

  function primaryQuizButtonLabel() {
    if (!activeQuestion) return "";
    const fb = answerFeedback[activeQuestion.id];
    if (checkStatus === "loading" && !fb) return "Checking…";
    if (!fb) return "Show result";
    if (currentIndex < questions.length - 1) return "Next question";
    return "Submit quiz";
  }

  async function submitQuiz() {
    if (!subjectId || questions.length === 0) return;
    if (activeQuestion) {
      const checked = await evaluateQuestion(activeQuestion);
      if (!checked) return;
    }
    const allChecked = questions.every((q) => answerFeedback[q.id]);
    if (!allChecked) {
      setError("Use Show result on each question, then Next question, before submitting.");
      return;
    }

    setStatus("loading");
    const payload = {
      grade,
      subjectId,
      responses: questions.map((question) => ({
        questionId: question.id,
        selectedOption: answers[question.id] ?? "",
      })),
    };

    const response = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      score?: number;
      results?: QuizResult[];
      error?: string;
    };

    if (!response.ok || typeof data.score !== "number" || !data.results) {
      setStatus("quiz");
      setError(data.error ?? "Could not submit quiz.");
      return;
    }

    setScore(data.score);
    setResults(data.results);
    setStatus("result");
    loadProgress().catch(() => undefined);
  }

  const selectedSubject = subjects.find((subject) => subject.id === subjectId)?.name ?? "Subject";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-12 lg:px-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Family code</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Enter the code you get from your parent or teacher. If you received a Student ID + access code pair, use the
          Student Access page to sign in and start your quiz.
        </p>
        <div className="mt-4 flex max-w-xl flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="family-code">
              Code from parent or teacher
            </label>
            <input
              id="family-code"
              value={familyCodeInput}
              onChange={(event) => setFamilyCodeInput(event.target.value)}
              placeholder="e.g. A1B2C3D4"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm uppercase"
            />
          </div>
          <button
            type="button"
            onClick={() => void redeemFamilyCode()}
            disabled={familyStatus === "loading"}
            className="rounded-lg border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
          >
            Apply code
          </button>
        </div>
        {familyMessage && (
          <p
            className={`mt-3 rounded-lg px-4 py-2 text-sm ${
              familyMessage.startsWith("Code applied")
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {familyMessage}
          </p>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quiz setup</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Grade</p>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                value={grade}
                onChange={(event) => setGrade(Number(event.target.value))}
                disabled={status === "quiz" || status === "loading"}
              >
                {GRADES.map((optionGrade) => (
                  <option key={optionGrade} value={optionGrade}>
                    Grade {optionGrade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Subject</p>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                value={subjectId ?? ""}
                onChange={(event) => setSubjectId(Number(event.target.value))}
                disabled={status === "quiz" || status === "loading" || subjects.length === 0}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={startQuiz}
              disabled={!subjectId || status === "loading" || status === "quiz"}
            >
              Start quiz
            </button>
          </div>
        </aside>

        <section className="min-h-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {status === "setup" && !error && (
          <p className="text-sm leading-relaxed text-slate-600">
            Choose a grade and subject on the left, then start a quiz. Your progress appears below after you finish.
          </p>
        )}

        {status === "loading" && <p className="text-sm text-slate-600">Loading...</p>}

        {status === "quiz" && activeQuestion && (
          <div className="space-y-5">
            {quizWarning && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{quizWarning}</p>
            )}
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                {selectedSubject} - Grade {grade}
              </span>
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-300"
                style={{ width: `${quizProgress * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">Reviewed with feedback: {feedbackCount}/{questions.length}</p>

            <p className="font-medium text-slate-900">{activeQuestion.question}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeQuestion.options.map((option) => {
                const selected = answers[activeQuestion.id] === option;
                const fb = answerFeedback[activeQuestion.id];
                const isCorrectOpt = fb && option === fb.correctAnswer;
                const isWrongPick = fb && selected && !fb.isCorrect && option === answers[activeQuestion.id];
                const base =
                  "rounded-lg border px-3 py-3 text-left text-sm leading-snug transition-colors disabled:cursor-default";
                let cls = "border-slate-300 hover:border-slate-400";
                if (fb) {
                  if (isCorrectOpt) cls = "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200";
                  else if (isWrongPick) cls = "border-red-400 bg-red-50 text-red-950";
                  else cls = "border-slate-100 bg-slate-50 text-slate-400";
                } else if (selected) {
                  cls = "border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-100";
                }
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={Boolean(fb)}
                    className={`${base} ${cls}`}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [activeQuestion.id]: option,
                      }))
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {answerFeedback[activeQuestion.id] && (
              <div
                ref={feedbackRef}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  answerFeedback[activeQuestion.id].isCorrect
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900"
                }`}
              >
                <p className="font-semibold">
                  {answerFeedback[activeQuestion.id].isCorrect ? "Correct!" : "Incorrect — see explanation."}
                </p>
                {!answerFeedback[activeQuestion.id].isCorrect && (
                  <p className="mt-1">
                    Correct answer:{" "}
                    <span className="font-medium">{answerFeedback[activeQuestion.id].correctAnswer}</span>
                  </p>
                )}
                <p className="mt-1 text-slate-700">{answerFeedback[activeQuestion.id].explanation}</p>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Tap <span className="font-medium text-slate-700">Show result</span> for feedback, then{" "}
              <span className="font-medium text-slate-700">Next question</span> when you are ready.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Answered: {answeredCount}/{questions.length}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    answerFeedback[activeQuestion.id] && currentIndex === questions.length - 1
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                  disabled={
                    checkStatus === "loading" ||
                    (!answerFeedback[activeQuestion.id] && !answers[activeQuestion.id])
                  }
                  onClick={() => void handleQuizPrimaryAction()}
                >
                  {primaryQuizButtonLabel()}
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "result" && (
          <div className="space-y-5">
            <p className="text-2xl font-semibold text-slate-900">Your score: {score}%</p>
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={startQuiz}
            >
              Try another quiz
            </button>
            <div className="grid gap-3 lg:grid-cols-2">
              {results.map((result) => (
                <article
                  key={result.questionId}
                  className={`rounded-lg border p-4 ${
                    result.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <p className="font-medium text-slate-900">{result.question}</p>
                  <p className="mt-2 text-sm text-slate-700">Your answer: {result.selectedOption}</p>
                  {!result.isCorrect && (
                    <p className="text-sm text-slate-700">Correct answer: {result.correctAnswer}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-600">{result.explanation}</p>
                </article>
              ))}
            </div>
          </div>
        )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Progress tracker</h2>
        {!progress ? (
          <p className="mt-3 text-sm text-slate-600">No progress yet.</p>
        ) : (
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Recent Quizzes</h3>
              <div className="mt-2 space-y-2">
                {progress.history.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                    <p className="font-medium text-slate-900">
                      {item.subject} (Grade {item.grade})
                    </p>
                    <p className="text-slate-600">Score: {item.score}%</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Weak Subjects</h3>
              <div className="mt-2 space-y-2">
                {progress.weakSubjects.length === 0 ? (
                  <p className="text-sm text-slate-600">No weak subjects flagged yet.</p>
                ) : (
                  progress.weakSubjects.map((item) => (
                    <div key={item.subject} className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm">
                      <p className="font-medium text-red-800">
                        {item.subject} - Avg {item.averageScore}%
                      </p>
                      {item.weakAreas[0] && <p className="text-red-700">Focus: {item.weakAreas[0]}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
