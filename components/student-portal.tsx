"use client";

import { useEffect, useMemo, useState } from "react";

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

  const activeQuestion = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answers[question.id])).length,
    [questions, answers],
  );

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

  async function startQuiz() {
    if (!subjectId) return;

    setStatus("loading");
    setError(null);

    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, subjectId }),
    });
    const data = (await response.json()) as {
      questions?: QuizQuestion[];
      error?: string;
    };

    if (!response.ok || !data.questions) {
      setStatus("setup");
      setError(data.error ?? "Could not start quiz.");
      return;
    }

    setQuestions(data.questions);
    setAnswers({});
    setResults([]);
    setScore(null);
    setCurrentIndex(0);
    setStatus("quiz");
  }

  async function submitQuiz() {
    if (!subjectId || questions.length === 0) return;

    setStatus("loading");
    const payload = {
      grade,
      subjectId,
      responses: questions
        .filter((question) => Boolean(answers[question.id]))
        .map((question) => ({
          questionId: question.id,
          selectedOption: answers[question.id],
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Grade</p>
            <select
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2"
              value={grade}
              onChange={(event) => setGrade(Number(event.target.value))}
              disabled={status === "quiz" || status === "loading"}
            >
              {[7, 8, 9, 10, 11, 12].map((optionGrade) => (
                <option key={optionGrade} value={optionGrade}>
                  Grade {optionGrade}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Subject</p>
            <select
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2"
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
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={startQuiz}
            disabled={!subjectId || status === "loading" || status === "quiz"}
          >
            Start Quiz
          </button>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {status === "loading" && <p className="text-sm text-slate-600">Loading...</p>}

        {status === "quiz" && activeQuestion && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                {selectedSubject} - Grade {grade}
              </span>
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            <div className="h-2 rounded bg-slate-200">
              <div
                className="h-2 rounded bg-emerald-600 transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <p className="font-medium text-slate-900">{activeQuestion.question}</p>
            <div className="space-y-2">
              {activeQuestion.options.map((option) => (
                <button
                  key={option}
                  className={`w-full rounded-lg border px-3 py-2 text-left ${
                    answers[activeQuestion.id] === option
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [activeQuestion.id]: option,
                    }))
                  }
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Answered: {answeredCount}/{questions.length}
              </p>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                >
                  Previous
                </button>
                {currentIndex < questions.length - 1 ? (
                  <button
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                    onClick={() =>
                      setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                    }
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    onClick={submitQuiz}
                    disabled={answeredCount === 0}
                  >
                    Submit Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {status === "result" && (
          <div className="space-y-4">
            <p className="text-xl font-semibold text-slate-900">Your score: {score}%</p>
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={startQuiz}
            >
              Try another quiz
            </button>
            <div className="space-y-3">
              {results.map((result) => (
                <article
                  key={result.questionId}
                  className={`rounded-lg border p-3 ${
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Progress Tracker</h2>
        {!progress ? (
          <p className="mt-3 text-sm text-slate-600">No progress yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
