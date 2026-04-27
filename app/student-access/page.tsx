"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";

type Subject = {
  id: number | string;
  name: string;
  grade_level: number;
};

type Question = {
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

type PerQuestionFeedback = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
};

export default function StudentAccessPage() {
  const [studentId, setStudentId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("Student");
  const [selectedGrade, setSelectedGrade] = useState<number>(7);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizPhase, setQuizPhase] = useState<"idle" | "active" | "complete">("idle");
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answerFeedback, setAnswerFeedback] = useState<Record<number, PerQuestionFeedback>>({});
  const [score, setScore] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [checkStatus, setCheckStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [quizWarning, setQuizWarning] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const activeQuestion = questions[quizStep];
  const checkedCount = useMemo(() => Object.keys(answerFeedback).length, [answerFeedback]);
  const progressFraction = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.min(1, checkedCount / questions.length);
  }, [questions.length, checkedCount]);

  async function loadSubjects(grade: number, token: string) {
    const response = await fetch(`/api/public/student/subjects?grade=${grade}`, {
      headers: { "x-student-session": token },
    });
    const data = (await response.json()) as { subjects?: Subject[]; error?: string };
    if (!response.ok || !data.subjects) {
      setSubjects([]);
      setSubjectId(null);
      setError(data.error ?? "Could not load subjects.");
      return;
    }
    setSubjects(data.subjects);
    const firstSubjectId = data.subjects[0]?.id;
    if (typeof firstSubjectId === "undefined") {
      setSubjectId(null);
    } else {
      setSubjectId(typeof firstSubjectId === "number" ? firstSubjectId : Number(firstSubjectId));
    }
  }

  useEffect(() => {
    if (!sessionToken) return;
    const timer = setTimeout(() => {
      void loadSubjects(selectedGrade, sessionToken);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedGrade, sessionToken]);

  useEffect(() => {
    if (!activeQuestion) return;
    if (!answerFeedback[activeQuestion.id]) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeQuestion?.id, answerFeedback]);

  async function startSession() {
    setStatus("loading");
    setError(null);
    setQuestions([]);
    setAnswers({});
    setAnswerFeedback({});
    setQuizPhase("idle");
    setQuizStep(0);
    setScore(null);
    setResults([]);
    try {
      const response = await fetch("/api/public/student/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, accessCode }),
      });
      const data = (await response.json()) as {
        sessionToken?: string;
        student?: { displayName: string; grade: number | null };
        error?: string;
      };
      if (!response.ok || !data.sessionToken || !data.student) {
        setError(data.error ?? "Could not start student session.");
        setStatus("idle");
        return;
      }

      setSessionToken(data.sessionToken);
      setStudentName(data.student.displayName);
      setSelectedGrade(data.student.grade ?? 7);
      await loadSubjects(data.student.grade ?? 7, data.sessionToken);
    } catch {
      setError("Could not start student session.");
    } finally {
      setStatus("idle");
    }
  }

  async function startQuiz() {
    if (!sessionToken || !subjectId) return;
    setStatus("loading");
    setError(null);
    setAnswers({});
    setAnswerFeedback({});
    setQuizStep(0);
    setScore(null);
    setResults([]);
    setQuizPhase("idle");
    setQuizWarning(null);
    try {
      const response = await fetch("/api/public/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-student-session": sessionToken,
        },
        body: JSON.stringify({ grade: selectedGrade, subjectId }),
      });
      const data = (await response.json()) as {
        questions?: Question[];
        warning?: string;
        error?: string;
      };
      if (!response.ok || !data.questions?.length) {
        setError(data.error ?? "Could not start quiz.");
        setStatus("idle");
        return;
      }
      setQuizWarning(typeof data.warning === "string" ? data.warning : null);
      setQuestions(data.questions);
      setQuizPhase("active");
    } catch {
      setError("Could not start quiz.");
    } finally {
      setStatus("idle");
    }
  }

  async function evaluateQuestion(question: Question) {
    if (!sessionToken || !subjectId) return false;
    if (answerFeedback[question.id]) return true;
    const selected = answers[question.id];
    if (!selected) {
      setError("Pick an answer first.");
      return false;
    }
    setCheckStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/public/quiz/check-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-student-session": sessionToken,
        },
        body: JSON.stringify({
          questionId: question.id,
          subjectId,
          grade: selectedGrade,
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
      setAnswerFeedback((current) => ({
        ...current,
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
    if (quizStep < questions.length - 1) {
      setQuizStep((s) => Math.min(questions.length - 1, s + 1));
      return;
    }
    await submitQuiz();
  }

  function primaryQuizButtonLabel() {
    if (!activeQuestion) return "";
    const fb = answerFeedback[activeQuestion.id];
    if (checkStatus === "loading" && !fb) return "Checking…";
    if (!fb) return "Show result";
    if (quizStep < questions.length - 1) return "Next question";
    return "Submit quiz";
  }

  async function submitQuiz() {
    if (!sessionToken || !subjectId || questions.length === 0) return;
    if (activeQuestion) {
      const checked = await evaluateQuestion(activeQuestion);
      if (!checked) return;
    }
    const allChecked = questions.every((item) => Boolean(answerFeedback[item.id]));
    if (!allChecked) {
      setError("Use Show result on each question, then Next question, before submitting.");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const responses = questions.map((item) => ({
        questionId: item.id,
        selectedOption: answers[item.id] ?? "",
      }));

      const response = await fetch("/api/public/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-student-session": sessionToken,
        },
        body: JSON.stringify({ grade: selectedGrade, subjectId, responses }),
      });
      const data = (await response.json()) as { score?: number; results?: QuizResult[]; error?: string };
      if (!response.ok || typeof data.score !== "number" || !data.results) {
        setError(data.error ?? "Could not submit quiz.");
        setStatus("idle");
        return;
      }

      setScore(data.score);
      setResults(data.results);
      setQuizPhase("complete");
    } catch {
      setError("Could not submit quiz.");
    } finally {
      setStatus("idle");
    }
  }

  function resetQuizView() {
    setQuestions([]);
    setAnswers({});
    setAnswerFeedback({});
    setQuizStep(0);
    setQuizPhase("idle");
    setScore(null);
    setResults([]);
    setQuizWarning(null);
  }

  function optionClass(question: Question, option: string) {
    const selected = answers[question.id] === option;
    const fb = answerFeedback[question.id];
    if (!fb) {
      return selected
        ? "border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-200"
        : "border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-slate-50";
    }
    const isCorrectOption = option === fb.correctAnswer;
    const isWrongPick = selected && !fb.isCorrect && option === answers[question.id];
    if (isCorrectOption) {
      return "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200";
    }
    if (isWrongPick) {
      return "border-red-400 bg-red-50 text-red-950";
    }
    return "border-slate-100 bg-slate-50 text-slate-400";
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <PublicHeader />
      <main className="flex-1 px-6 py-10 lg:px-10">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md lg:p-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Student access</h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter the Student ID and code shared by your parent or teacher, then continue to your quiz.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Use your student access code first. Parent family code also works for linked parent students.
            </p>

            {!sessionToken ? (
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value.toUpperCase())}
                  placeholder="Student ID (e.g. STU-00012)"
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
                <input
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  placeholder="Access code"
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void startSession()}
                  disabled={status === "loading"}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="font-semibold text-emerald-900">Signed in as {studentName}</p>
                <p className="text-sm text-emerald-800">Choose grade and subject, then start a quiz.</p>
              </div>
            )}
            {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
          </section>

          {sessionToken && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md lg:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Quiz setup</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select
                  value={selectedGrade}
                  onChange={(event) => setSelectedGrade(Number(event.target.value))}
                  disabled={quizPhase === "active"}
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100"
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
                    <option key={item} value={item}>
                      Grade {item}
                    </option>
                  ))}
                </select>
                <select
                  value={subjectId ?? ""}
                  onChange={(event) => setSubjectId(Number(event.target.value))}
                  disabled={quizPhase === "active"}
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100"
                >
                  {subjects.map((subject) => (
                    <option key={String(subject.id)} value={String(subject.id)}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void startQuiz()}
                  disabled={status === "loading" || !subjectId || quizPhase === "active"}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  Start quiz
                </button>
              </div>
              {quizPhase === "active" && (
                <p className="mt-2 text-xs text-slate-500">Finish or leave the quiz below before changing grade or subject.</p>
              )}
              {quizWarning && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{quizWarning}</p>
              )}
            </section>
          )}

          {sessionToken && quizPhase === "active" && activeQuestion && (
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md">
              <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between gap-3 text-sm font-medium">
                  <span>
                    Question {quizStep + 1} of {questions.length}
                  </span>
                  <span>{Math.round(progressFraction * 100)}% reviewed</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
                    style={{ width: `${progressFraction * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-6 lg:p-8">
                {quizWarning && (
                  <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{quizWarning}</p>
                )}
                <p className="text-base font-medium leading-relaxed text-slate-900">{activeQuestion.question}</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {activeQuestion.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={Boolean(answerFeedback[activeQuestion.id])}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [activeQuestion.id]: option,
                        }))
                      }
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${optionClass(activeQuestion, option)}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {answerFeedback[activeQuestion.id] && (
                  <div
                    ref={feedbackRef}
                    className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                      answerFeedback[activeQuestion.id].isCorrect
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-red-200 bg-red-50 text-red-900"
                    }`}
                  >
                    <p className="font-semibold">
                      {answerFeedback[activeQuestion.id].isCorrect ? "Correct!" : "Not quite — here is the right answer."}
                    </p>
                    {!answerFeedback[activeQuestion.id].isCorrect && (
                      <p className="mt-1 text-red-800">
                        Correct: <span className="font-medium">{answerFeedback[activeQuestion.id].correctAnswer}</span>
                      </p>
                    )}
                    <p className="mt-2 text-slate-700">{answerFeedback[activeQuestion.id].explanation}</p>
                  </div>
                )}

                <p className="mt-4 text-xs text-slate-500">
                  Tap <span className="font-medium text-slate-700">Show result</span> to see if you were right, then{" "}
                  <span className="font-medium text-slate-700">Next question</span> when you are ready to move on.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={quizStep === 0}
                    onClick={() => setQuizStep((s) => Math.max(0, s - 1))}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={
                      checkStatus === "loading" ||
                      status === "loading" ||
                      (!answerFeedback[activeQuestion.id] && !answers[activeQuestion.id])
                    }
                    onClick={() => void handleQuizPrimaryAction()}
                    className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                      answerFeedback[activeQuestion.id] && quizStep === questions.length - 1
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    {primaryQuizButtonLabel()}
                  </button>
                </div>
              </div>
            </section>
          )}

          {quizPhase === "complete" && score !== null && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md lg:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Results</h2>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{score}%</p>
              <button
                type="button"
                onClick={resetQuizView}
                className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Take another quiz
              </button>
              <div className="mt-4 space-y-3">
                {results.map((result) => (
                  <article
                    key={result.questionId}
                    className={`rounded-xl border p-4 text-sm ${
                      result.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                    }`}
                  >
                    <p className="font-medium text-slate-900">{result.question}</p>
                    <p className="mt-1 text-slate-700">Your answer: {result.selectedOption}</p>
                    <p className="text-slate-700">Correct answer: {result.correctAnswer}</p>
                    <p className="mt-1 text-slate-600">{result.explanation}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
