"use client";

import { useEffect, useMemo, useState } from "react";

type AdminStats = {
  total_users: number;
  total_quizzes: number;
  active_users_30d: number;
};

type Breakdown = {
  label: string;
  count: number;
};

type PopularSubject = {
  subject: string;
  quizzes_taken: number;
};

type UserRow = {
  id: number;
  clerk_id: string;
  role: string;
  plan: string;
  grade: number | null;
  school: string | null;
  created_at: string;
};

type Subject = {
  id: number;
  name: string;
  grade_level: number;
};

type HardcodedQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  generated_at: string | null;
};

const DEFAULT_FORM = {
  id: 0,
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  answer: "",
  explanation: "",
  difficulty: "medium" as "easy" | "medium" | "hard",
};

export function AdminPortal() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [roleBreakdown, setRoleBreakdown] = useState<Breakdown[]>([]);
  const [planBreakdown, setPlanBreakdown] = useState<Breakdown[]>([]);
  const [popularSubjects, setPopularSubjects] = useState<PopularSubject[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  const [grade, setGrade] = useState(7);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<HardcodedQuestion[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);

  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const options = useMemo(
    () => [form.optionA, form.optionB, form.optionC, form.optionD].map((opt) => opt.trim()),
    [form.optionA, form.optionB, form.optionC, form.optionD],
  );

  async function loadOverview() {
    const response = await fetch("/api/admin/overview");
    const data = (await response.json()) as {
      stats?: AdminStats;
      roleBreakdown?: Breakdown[];
      planBreakdown?: Breakdown[];
      popularSubjects?: PopularSubject[];
      users?: UserRow[];
      error?: string;
    };

    if (!response.ok || !data.stats || !data.users) {
      setError(data.error ?? "Failed to load admin overview.");
      return;
    }

    setStats(data.stats);
    setRoleBreakdown(data.roleBreakdown ?? []);
    setPlanBreakdown(data.planBreakdown ?? []);
    setPopularSubjects(data.popularSubjects ?? []);
    setUsers(data.users);
  }

  async function loadSubjects(nextGrade: number) {
    const response = await fetch(`/api/student/subjects?grade=${nextGrade}`);
    const data = (await response.json()) as { subjects?: Subject[]; error?: string };
    if (!response.ok || !data.subjects) {
      setSubjects([]);
      setSubjectId(null);
      return;
    }
    setSubjects(data.subjects);
    setSubjectId(data.subjects[0]?.id ?? null);
  }

  async function loadQuestions(nextSubjectId: number, nextGrade: number) {
    const response = await fetch(
      `/api/admin/questions?subjectId=${nextSubjectId}&grade=${nextGrade}`,
    );
    const data = (await response.json()) as { questions?: HardcodedQuestion[]; error?: string };
    if (!response.ok || !data.questions) {
      setQuestions([]);
      setError(data.error ?? "Failed to load hardcoded questions.");
      return;
    }
    setQuestions(data.questions);
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await loadOverview();
        if (!cancelled) setError(null);
      } catch {
        if (!cancelled) setError("Could not load admin overview.");
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function syncSubjects() {
      try {
        await loadSubjects(grade);
      } catch {
        if (!cancelled) {
          setSubjects([]);
          setSubjectId(null);
        }
      }
    }
    void syncSubjects();
    return () => {
      cancelled = true;
    };
  }, [grade]);

  useEffect(() => {
    let cancelled = false;
    async function syncQuestions() {
      if (!subjectId) return;
      try {
        await loadQuestions(subjectId, grade);
      } catch {
        if (!cancelled) setQuestions([]);
      }
    }
    void syncQuestions();
    return () => {
      cancelled = true;
    };
  }, [subjectId, grade]);

  function fillFromQuestion(question: HardcodedQuestion) {
    setForm({
      id: question.id,
      question: question.question,
      optionA: question.options[0] ?? "",
      optionB: question.options[1] ?? "",
      optionC: question.options[2] ?? "",
      optionD: question.options[3] ?? "",
      answer: question.answer,
      explanation: question.explanation,
      difficulty: question.difficulty,
    });
  }

  function clearForm() {
    setForm(DEFAULT_FORM);
    setSuccess(null);
    setError(null);
  }

  async function saveQuestion() {
    if (!subjectId) return;

    const cleanedOptions = options.filter((opt) => opt.length > 0);
    if (cleanedOptions.length !== 4) {
      setError("Provide all four options.");
      return;
    }
    if (!cleanedOptions.includes(form.answer.trim())) {
      setError("Answer must exactly match one of the options.");
      return;
    }

    setStatus("loading");
    setError(null);
    setSuccess(null);

    const payload = {
      id: form.id || undefined,
      subjectId,
      grade,
      question: form.question.trim(),
      options: cleanedOptions,
      answer: form.answer.trim(),
      explanation: form.explanation.trim(),
      difficulty: form.difficulty,
    };

    try {
      const response = await fetch("/api/admin/questions", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { question?: HardcodedQuestion; error?: string };

      if (!response.ok || !data.question) {
        setError(data.error ?? "Could not save question.");
        setStatus("idle");
        return;
      }

      setSuccess(form.id ? "Question updated." : "Question added.");
      clearForm();
      await loadQuestions(subjectId, grade);
    } catch {
      setError("Could not save question.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Usage Overview</h2>
        {!stats ? (
          <p className="mt-3 text-sm text-slate-600">Loading stats...</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.total_users}</p>
            </article>
            <article className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm text-slate-600">Quizzes Taken</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.total_quizzes}</p>
            </article>
            <article className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm text-slate-600">Active Students (30d)</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.active_users_30d}</p>
            </article>
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Popular Subjects</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {popularSubjects.map((item) => (
                <li key={item.subject} className="rounded border border-slate-200 px-2 py-1">
                  {item.subject} - {item.quizzes_taken}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Role Breakdown</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {roleBreakdown.map((item) => (
                <li key={item.label} className="rounded border border-slate-200 px-2 py-1">
                  {item.label} - {item.count}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Plan Breakdown</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {planBreakdown.map((item) => (
                <li key={item.label} className="rounded border border-slate-200 px-2 py-1">
                  {item.label} - {item.count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Users, Roles and Plans</h2>
        <div className="mt-3 max-h-80 overflow-auto rounded border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Grade</th>
                <th className="px-3 py-2">School</th>
                <th className="px-3 py-2">Clerk ID</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{user.id}</td>
                  <td className="px-3 py-2">{user.role}</td>
                  <td className="px-3 py-2">{user.plan}</td>
                  <td className="px-3 py-2">{user.grade ?? "-"}</td>
                  <td className="px-3 py-2">{user.school ?? "-"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{user.clerk_id}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-600" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Manage Hardcoded Questions</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={grade}
            onChange={(event) => setGrade(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((optionGrade) => (
              <option key={optionGrade} value={optionGrade}>
                Grade {optionGrade}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={subjectId ?? ""}
            onChange={(event) => setSubjectId(Number(event.target.value))}
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <button className="rounded bg-slate-800 px-3 py-2 text-white" onClick={clearForm}>
            New Question
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <textarea
              placeholder="Question"
              className="min-h-24 w-full rounded border border-slate-300 px-3 py-2"
              value={form.question}
              onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
            />
            <input
              placeholder="Option A"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.optionA}
              onChange={(event) => setForm((prev) => ({ ...prev, optionA: event.target.value }))}
            />
            <input
              placeholder="Option B"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.optionB}
              onChange={(event) => setForm((prev) => ({ ...prev, optionB: event.target.value }))}
            />
            <input
              placeholder="Option C"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.optionC}
              onChange={(event) => setForm((prev) => ({ ...prev, optionC: event.target.value }))}
            />
            <input
              placeholder="Option D"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.optionD}
              onChange={(event) => setForm((prev) => ({ ...prev, optionD: event.target.value }))}
            />
            <input
              placeholder="Answer (must match one option exactly)"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.answer}
              onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
            />
            <textarea
              placeholder="Explanation"
              className="min-h-20 w-full rounded border border-slate-300 px-3 py-2"
              value={form.explanation}
              onChange={(event) => setForm((prev) => ({ ...prev, explanation: event.target.value }))}
            />
            <select
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.difficulty}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  difficulty: event.target.value as "easy" | "medium" | "hard",
                }))
              }
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
            <button
              className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={saveQuestion}
              disabled={status === "loading" || !subjectId}
            >
              {form.id ? "Update Question" : "Add Question"}
            </button>
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
          </div>

          <div className="max-h-[560px] space-y-2 overflow-auto rounded border border-slate-200 p-2">
            {questions.map((question) => (
              <article key={question.id} className="rounded border border-slate-200 p-2">
                <p className="text-sm font-medium text-slate-900">{question.question}</p>
                <p className="mt-1 text-xs text-slate-600">Answer: {question.answer}</p>
                <button
                  className="mt-2 rounded bg-slate-800 px-2 py-1 text-xs text-white"
                  onClick={() => fillFromQuestion(question)}
                >
                  Edit
                </button>
              </article>
            ))}
            {questions.length === 0 && (
              <p className="text-sm text-slate-600">No hardcoded questions for this subject/grade yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
