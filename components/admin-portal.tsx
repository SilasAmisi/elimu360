"use client";

import { useEffect, useMemo, useState } from "react";

import { USER_PLANS, USER_ROLES } from "@/lib/domain";

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
  source?: string;
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

  const [editById, setEditById] = useState<Record<number, { role: string; plan: string; grade: string }>>({});
  const [userSaveStatus, setUserSaveStatus] = useState<"idle" | "loading">("idle");
  const [subjectName, setSubjectName] = useState("");
  const [subjectGrade, setSubjectGrade] = useState(7);
  const [subjectStatus, setSubjectStatus] = useState<"idle" | "loading">("idle");
  const [subjectMessage, setSubjectMessage] = useState<string | null>(null);
  const [questionListSource, setQuestionListSource] = useState<"hardcoded" | "ai">("hardcoded");
  const [generateCount, setGenerateCount] = useState(5);
  const [generateStatus, setGenerateStatus] = useState<"idle" | "loading">("idle");
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

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
    const next: Record<number, { role: string; plan: string; grade: string }> = {};
    for (const user of data.users) {
      next[user.id] = {
        role: user.role,
        plan: user.plan,
        grade: user.grade != null ? String(user.grade) : "",
      };
    }
    setEditById(next);
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

  async function loadQuestions(nextSubjectId: number, nextGrade: number, source: "hardcoded" | "ai") {
    const response = await fetch(
      `/api/admin/questions?subjectId=${nextSubjectId}&grade=${nextGrade}&source=${source}`,
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

  async function saveUserRow(userId: number) {
    const draft = editById[userId];
    if (!draft) return;
    setUserSaveStatus("loading");
    setError(null);
    setSuccess(null);
    try {
      const gradePayload =
        draft.grade.trim() === "" ? null : Number(draft.grade);
      if (draft.grade.trim() !== "" && (!Number.isInteger(gradePayload) || gradePayload! < 1 || gradePayload! > 12)) {
        setError("Grade must be between 1 and 12 or empty.");
        setUserSaveStatus("idle");
        return;
      }
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: draft.role,
          plan: draft.plan,
          grade: gradePayload,
        }),
      });
      const data = (await response.json()) as { user?: UserRow; error?: string };
      if (!response.ok || !data.user) {
        setError(data.error ?? "Could not update user.");
        setUserSaveStatus("idle");
        return;
      }
      setSuccess(`User #${userId} updated.`);
      await loadOverview();
    } catch {
      setError("Could not update user.");
    } finally {
      setUserSaveStatus("idle");
    }
  }

  async function removeSelectedSubject() {
    if (!subjectId) return;
    const subject = subjects.find((s) => s.id === subjectId);
    const label = subject ? `${subject.name} (grade ${subject.grade_level})` : "this subject";
    if (!window.confirm(`Remove ${label} from the catalog? This deletes its questions, progress links, and related rows.`)) {
      return;
    }
    setSubjectStatus("loading");
    setSubjectMessage(null);
    try {
      const response = await fetch(`/api/admin/subjects?subjectId=${subjectId}`, { method: "DELETE" });
      const data = (await response.json()) as { deleted?: { name: string }; error?: string };
      if (!response.ok) {
        setSubjectMessage(data.error ?? "Could not remove subject.");
        setSubjectStatus("idle");
        return;
      }
      setSubjectMessage(data.deleted ? `Removed ${data.deleted.name}.` : "Subject removed.");
      await loadSubjects(grade);
    } catch {
      setSubjectMessage("Could not remove subject.");
    } finally {
      setSubjectStatus("idle");
    }
  }

  async function addSubject() {
    const name = subjectName.trim();
    if (name.length < 2) {
      setSubjectMessage("Enter a subject name.");
      return;
    }
    setSubjectStatus("loading");
    setSubjectMessage(null);
    try {
      const response = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gradeLevel: subjectGrade }),
      });
      const data = (await response.json()) as { subject?: { id: number }; message?: string; error?: string };
      if (!response.ok) {
        setSubjectMessage(data.error ?? "Request failed.");
        setSubjectStatus("idle");
        return;
      }
      if (data.subject) {
        setSubjectMessage("Subject added.");
        setSubjectName("");
      } else {
        setSubjectMessage(data.message ?? "No new row (may already exist).");
      }
      await loadSubjects(grade);
    } catch {
      setSubjectMessage("Could not add subject.");
    } finally {
      setSubjectStatus("idle");
    }
  }

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
        await loadQuestions(subjectId, grade, questionListSource);
      } catch {
        if (!cancelled) setQuestions([]);
      }
    }
    void syncQuestions();
    return () => {
      cancelled = true;
    };
  }, [subjectId, grade, questionListSource]);

  function fillFromQuestion(question: HardcodedQuestion) {
    if (question.source === "ai") {
      setError("AI-generated questions are read-only in this panel.");
      return;
    }
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

  async function generateAiQuestionsFromAdmin() {
    if (!subjectId) return;
    setGenerateStatus("loading");
    setGenerateMessage(null);
    try {
      const response = await fetch("/api/admin/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, grade, count: generateCount }),
      });
      const data = (await response.json()) as { ok?: boolean; count?: number; error?: string };
      if (!response.ok || !data.ok) {
        setGenerateMessage("Could not generate questions right now. Please try again.");
        return;
      }
      setGenerateMessage(`Saved ${data.count ?? 0} AI question(s) for this subject and grade.`);
      await loadQuestions(subjectId, grade, questionListSource);
    } catch {
      setGenerateMessage("Could not generate questions right now. Please try again.");
    } finally {
      setGenerateStatus("idle");
    }
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
      await loadQuestions(subjectId, grade, questionListSource);
    } catch {
      setError("Could not save question.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-12 lg:px-10">
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Users, roles, and plans</h2>
        <p className="mt-2 text-sm text-slate-600">
          Changes sync to Clerk when possible. Premium parents automatically receive a family access code for students.
        </p>
        <div className="mt-4 max-h-[28rem] overflow-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Grade</th>
                <th className="px-3 py-2">School</th>
                <th className="px-3 py-2">Clerk ID</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const draft = editById[user.id] ?? {
                  role: user.role,
                  plan: user.plan,
                  grade: user.grade != null ? String(user.grade) : "",
                };
                return (
                  <tr key={user.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 font-medium">{user.id}</td>
                    <td className="px-3 py-2">
                      <select
                        className="w-full max-w-[120px] rounded border border-slate-300 px-2 py-1"
                        value={draft.role}
                        onChange={(event) =>
                          setEditById((prev) => ({
                            ...prev,
                            [user.id]: { ...draft, role: event.target.value },
                          }))
                        }
                      >
                        {USER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="w-full max-w-[110px] rounded border border-slate-300 px-2 py-1"
                        value={draft.plan}
                        onChange={(event) =>
                          setEditById((prev) => ({
                            ...prev,
                            [user.id]: { ...draft, plan: event.target.value },
                          }))
                        }
                      >
                        {USER_PLANS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-16 rounded border border-slate-300 px-2 py-1"
                        value={draft.grade}
                        onChange={(event) =>
                          setEditById((prev) => ({
                            ...prev,
                            [user.id]: { ...draft, grade: event.target.value },
                          }))
                        }
                        placeholder="—"
                      />
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-slate-600" title={user.school ?? ""}>
                      {user.school ?? "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-1 font-mono text-xs text-slate-600" title={user.clerk_id}>
                      {user.clerk_id}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                        disabled={userSaveStatus === "loading"}
                        onClick={() => void saveUserRow(user.id)}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-600" colSpan={7}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Subjects per grade</h2>
        <p className="mt-2 text-sm text-slate-600">
          Add a subject for a grade when it does not already exist (unique by name and grade). Remove the selected
          subject to drop it for that grade only — this deletes linked questions and progress for that subject.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="new-subject-name">
              Subject name
            </label>
            <input
              id="new-subject-name"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              className="mt-1 block w-56 rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Agriculture"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="new-subject-grade">
              Grade
            </label>
            <select
              id="new-subject-grade"
              value={subjectGrade}
              onChange={(event) => setSubjectGrade(Number(event.target.value))}
              className="mt-1 block rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={subjectStatus === "loading"}
            onClick={() => void addSubject()}
          >
            Add subject
          </button>
        </div>
        {subjectMessage && <p className="mt-3 text-sm text-slate-700">{subjectMessage}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Question bank</h2>
        <p className="mt-1 text-sm text-slate-600">
          Edit the hardcoded bank below, or switch to <span className="font-medium">AI-generated</span> to inspect
          cached model questions stored for this grade and subject (read-only).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              questionListSource === "hardcoded"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
            onClick={() => {
              setQuestionListSource("hardcoded");
              clearForm();
            }}
          >
            Hardcoded (editable)
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              questionListSource === "ai"
                ? "bg-violet-700 text-white"
                : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
            onClick={() => {
              setQuestionListSource("ai");
              clearForm();
            }}
          >
            AI-generated (view)
          </button>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Generate with OpenAI</h3>
          <p className="mt-1 text-xs text-slate-600">
            Creates new MCQs for the selected grade and subject and stores them in the AI question bank.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500" htmlFor="ai-gen-count">
                Count (1–10)
              </label>
              <input
                id="ai-gen-count"
                type="number"
                min={1}
                max={10}
                value={generateCount}
                onChange={(event) => setGenerateCount(Math.min(10, Math.max(1, Number(event.target.value) || 1)))}
                className="mt-1 block w-24 rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
              disabled={generateStatus === "loading" || !subjectId}
              onClick={() => void generateAiQuestionsFromAdmin()}
            >
              {generateStatus === "loading" ? "Generating…" : "Generate & save"}
            </button>
          </div>
          {generateMessage && (
            <p className="mt-2 text-sm text-slate-700" role="status">
              {generateMessage}
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 md:max-w-xl">
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
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded bg-slate-800 px-3 py-2 text-white" onClick={clearForm}>
              New Question
            </button>
            <button
              type="button"
              className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"
              disabled={subjectStatus === "loading" || !subjectId}
              onClick={() => void removeSelectedSubject()}
            >
              Remove this subject (grade)
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {questionListSource === "ai" && (
              <p className="rounded border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
                Switch to Hardcoded to add or edit questions.
              </p>
            )}
            <textarea
              placeholder="Question"
              className="min-h-24 w-full rounded border border-slate-300 px-3 py-2"
              value={form.question}
              disabled={questionListSource === "ai"}
              onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
            />
            <input
              placeholder="Option A"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.optionA}
              disabled={questionListSource === "ai"}
              onChange={(event) => setForm((prev) => ({ ...prev, optionA: event.target.value }))}
            />
            <input
              placeholder="Option B"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.optionB}
              disabled={questionListSource === "ai"}
              onChange={(event) => setForm((prev) => ({ ...prev, optionB: event.target.value }))}
            />
            <input
              placeholder="Option C"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.optionC}
              disabled={questionListSource === "ai"}
              onChange={(event) => setForm((prev) => ({ ...prev, optionC: event.target.value }))}
            />
            <input
              placeholder="Option D"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.optionD}
              disabled={questionListSource === "ai"}
              onChange={(event) => setForm((prev) => ({ ...prev, optionD: event.target.value }))}
            />
            <input
              placeholder="Answer (must match one option exactly)"
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.answer}
              disabled={questionListSource === "ai"}
              onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
            />
            <textarea
              placeholder="Explanation"
              className="min-h-20 w-full rounded border border-slate-300 px-3 py-2"
              value={form.explanation}
              disabled={questionListSource === "ai"}
              onChange={(event) => setForm((prev) => ({ ...prev, explanation: event.target.value }))}
            />
            <select
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={form.difficulty}
              disabled={questionListSource === "ai"}
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
              disabled={status === "loading" || !subjectId || questionListSource === "ai"}
            >
              {form.id ? "Update Question" : "Add Question"}
            </button>
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
          </div>

          <div className="max-h-[560px] space-y-2 overflow-auto rounded border border-slate-200 p-2">
            {questions.map((question) => (
              <article key={question.id} className="rounded border border-slate-200 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{question.question}</p>
                  {question.source === "ai" && (
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-800">
                      AI
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600">Answer: {question.answer}</p>
                <button
                  type="button"
                  className="mt-2 rounded bg-slate-800 px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={question.source === "ai"}
                  title={question.source === "ai" ? "Read-only" : "Load into editor"}
                  onClick={() => fillFromQuestion(question)}
                >
                  Edit
                </button>
              </article>
            ))}
            {questions.length === 0 && (
              <p className="text-sm text-slate-600">
                {questionListSource === "ai"
                  ? "No AI-generated questions available yet."
                  : "No hardcoded questions for this subject/grade yet."}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
