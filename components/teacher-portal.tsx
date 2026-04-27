"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type TeacherClass = {
  id: number;
  class_name: string;
  class_code: string;
  grade: number;
  created_at: string;
  student_count: number;
};

type Subject = {
  id: number;
  name: string;
};

type Assignment = {
  id: number;
  class_code: string;
  grade: number;
  due_date: string;
  subject: string;
};

type AssignmentResult = {
  studentId: number;
  studentName: string;
  assignmentId: number;
  subject: string;
  grade: number;
  averageScore: number | null;
  attempts: number;
  weakAreas: string[];
};

type TeacherOwnedQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: string;
};

const QUESTION_BANK_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const TQ_FORM_DEFAULT = {
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

export function TeacherPortal() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassCode, setSelectedClassCode] = useState<string>("");
  const [className, setClassName] = useState("Form 1 East");
  const [classGrade, setClassGrade] = useState(7);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignmentGrade, setAssignmentGrade] = useState(7);
  const [assignmentSubjectId, setAssignmentSubjectId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [results, setResults] = useState<AssignmentResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  const [questionBankGrade, setQuestionBankGrade] = useState(7);
  const [questionBankSubjects, setQuestionBankSubjects] = useState<Subject[]>([]);
  const [questionBankSubjectId, setQuestionBankSubjectId] = useState<number | null>(null);
  const [myQuestions, setMyQuestions] = useState<TeacherOwnedQuestion[]>([]);
  const [tqForm, setTqForm] = useState(TQ_FORM_DEFAULT);
  const [tqStatus, setTqStatus] = useState<"idle" | "loading">("idle");
  const [tqError, setTqError] = useState<string | null>(null);
  const [tqSuccess, setTqSuccess] = useState<string | null>(null);

  const tqOptions = useMemo(
    () => [tqForm.optionA, tqForm.optionB, tqForm.optionC, tqForm.optionD].map((opt) => opt.trim()),
    [tqForm.optionA, tqForm.optionB, tqForm.optionC, tqForm.optionD],
  );

  const loadClasses = useCallback(async () => {
    const response = await fetch("/api/teacher/classes");
    const data = (await response.json()) as { classes?: TeacherClass[]; error?: string };
    if (!response.ok || !data.classes) {
      setError(data.error ?? "Failed to load classes.");
      return;
    }
    setClasses(data.classes);
    const firstClass = data.classes[0];
    if (firstClass) {
      setSelectedClassCode((current) => current || firstClass.class_code);
      setAssignmentGrade(firstClass.grade);
    }
  }, []);

  async function loadQuestionBankSubjects(grade: number) {
    const response = await fetch(`/api/student/subjects?grade=${grade}`);
    const data = (await response.json()) as { subjects?: Subject[]; error?: string };
    if (!response.ok || !data.subjects) {
      setQuestionBankSubjects([]);
      setQuestionBankSubjectId(null);
      return;
    }
    setQuestionBankSubjects(data.subjects);
    setQuestionBankSubjectId(data.subjects[0]?.id ?? null);
  }

  async function loadMyQuestions(subjectId: number, grade: number) {
    const response = await fetch(
      `/api/teacher/questions?subjectId=${subjectId}&grade=${grade}`,
    );
    const data = (await response.json()) as { questions?: TeacherOwnedQuestion[]; error?: string };
    if (!response.ok || !data.questions) {
      setMyQuestions([]);
      setTqError(data.error ?? "Could not load your questions.");
      return;
    }
    setMyQuestions(data.questions);
    setTqError(null);
  }

  async function loadSubjects(grade: number) {
    const response = await fetch(`/api/student/subjects?grade=${grade}`);
    const data = (await response.json()) as { subjects?: Subject[]; error?: string };
    if (!response.ok || !data.subjects) {
      setSubjects([]);
      setAssignmentSubjectId(null);
      return;
    }
    setSubjects(data.subjects);
    setAssignmentSubjectId(data.subjects[0]?.id ?? null);
  }

  async function loadClassResults(classCode: string) {
    if (!classCode) return;
    const response = await fetch(`/api/teacher/assignments?classCode=${encodeURIComponent(classCode)}`);
    const data = (await response.json()) as {
      assignments?: Assignment[];
      results?: AssignmentResult[];
      error?: string;
    };
    if (!response.ok || !data.assignments || !data.results) {
      setAssignments([]);
      setResults([]);
      setError(data.error ?? "Failed to load class data.");
      return;
    }
    setAssignments(data.assignments);
    setResults(data.results);
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await loadClasses();
        if (!cancelled) setError(null);
      } catch {
        if (!cancelled) setError("Could not load teacher dashboard.");
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [loadClasses]);

  useEffect(() => {
    let cancelled = false;
    async function syncSubjects() {
      try {
        await loadSubjects(assignmentGrade);
      } catch {
        if (!cancelled) {
          setSubjects([]);
          setAssignmentSubjectId(null);
        }
      }
    }
    void syncSubjects();
    return () => {
      cancelled = true;
    };
  }, [assignmentGrade]);

  useEffect(() => {
    let cancelled = false;
    async function syncQuestionBankSubjects() {
      try {
        await loadQuestionBankSubjects(questionBankGrade);
      } catch {
        if (!cancelled) {
          setQuestionBankSubjects([]);
          setQuestionBankSubjectId(null);
        }
      }
    }
    void syncQuestionBankSubjects();
    return () => {
      cancelled = true;
    };
  }, [questionBankGrade]);

  useEffect(() => {
    let cancelled = false;
    async function syncMyQuestions() {
      if (!questionBankSubjectId) {
        setMyQuestions([]);
        return;
      }
      try {
        await loadMyQuestions(questionBankSubjectId, questionBankGrade);
      } catch {
        if (!cancelled) setMyQuestions([]);
      }
    }
    void syncMyQuestions();
    return () => {
      cancelled = true;
    };
  }, [questionBankSubjectId, questionBankGrade]);

  useEffect(() => {
    const cls = classes.find((c) => c.class_code === selectedClassCode);
    if (cls) {
      setQuestionBankGrade(cls.grade);
    }
  }, [selectedClassCode, classes]);

  useEffect(() => {
    let cancelled = false;
    async function syncClassData() {
      if (!selectedClassCode) return;
      try {
        await loadClassResults(selectedClassCode);
        if (!cancelled) setError(null);
      } catch {
        if (!cancelled) setError("Could not load class assignments.");
      }
    }
    void syncClassData();
    return () => {
      cancelled = true;
    };
  }, [selectedClassCode]);

  async function createClass() {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className, grade: classGrade }),
      });
      const data = (await response.json()) as { class?: TeacherClass; error?: string };
      if (!response.ok || !data.class) {
        setError(data.error ?? "Could not create class.");
        setStatus("idle");
        return;
      }

      await loadClasses();
      setSelectedClassCode(data.class.class_code);
      setAssignmentGrade(data.class.grade);
    } catch {
      setError("Could not create class.");
    } finally {
      setStatus("idle");
    }
  }

  function clearTqForm() {
    setTqForm(TQ_FORM_DEFAULT);
    setTqSuccess(null);
    setTqError(null);
  }

  function fillTqFromQuestion(question: TeacherOwnedQuestion) {
    setTqForm({
      id: question.id,
      question: question.question,
      optionA: question.options[0] ?? "",
      optionB: question.options[1] ?? "",
      optionC: question.options[2] ?? "",
      optionD: question.options[3] ?? "",
      answer: question.answer,
      explanation: question.explanation,
      difficulty: question.difficulty as "easy" | "medium" | "hard",
    });
    setTqError(null);
    setTqSuccess(null);
  }

  async function saveTeacherQuestion() {
    if (!questionBankSubjectId) return;
    const cleaned = tqOptions.filter((o) => o.length > 0);
    if (cleaned.length !== 4) {
      setTqError("Provide all four options.");
      return;
    }
    if (!cleaned.includes(tqForm.answer.trim())) {
      setTqError("Answer must exactly match one of the options.");
      return;
    }

    setTqStatus("loading");
    setTqError(null);
    setTqSuccess(null);
    const payload = {
      id: tqForm.id || undefined,
      subjectId: questionBankSubjectId,
      grade: questionBankGrade,
      question: tqForm.question.trim(),
      options: cleaned,
      answer: tqForm.answer.trim(),
      explanation: tqForm.explanation.trim(),
      difficulty: tqForm.difficulty,
    };

    try {
      const response = await fetch("/api/teacher/questions", {
        method: tqForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { question?: TeacherOwnedQuestion; error?: string };
      if (!response.ok || !data.question) {
        setTqError(data.error ?? "Could not save question.");
        setTqStatus("idle");
        return;
      }
      setTqSuccess(tqForm.id ? "Question updated." : "Question added.");
      clearTqForm();
      await loadMyQuestions(questionBankSubjectId, questionBankGrade);
    } catch {
      setTqError("Could not save question.");
    } finally {
      setTqStatus("idle");
    }
  }

  async function deleteTeacherQuestion(questionId: number) {
    if (!window.confirm("Delete this question? Students will no longer see it in quizzes.")) return;
    setTqStatus("loading");
    setTqError(null);
    try {
      const response = await fetch(`/api/teacher/questions?questionId=${questionId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setTqError(data.error ?? "Could not delete.");
        setTqStatus("idle");
        return;
      }
      setTqSuccess("Question removed.");
      if (questionBankSubjectId) {
        await loadMyQuestions(questionBankSubjectId, questionBankGrade);
      }
      if (tqForm.id === questionId) clearTqForm();
    } catch {
      setTqError("Could not delete question.");
    } finally {
      setTqStatus("idle");
    }
  }

  async function createAssignment() {
    if (!selectedClassCode || !assignmentSubjectId || !dueDate) return;
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode: selectedClassCode,
          subjectId: assignmentSubjectId,
          grade: assignmentGrade,
          dueDate: new Date(dueDate).toISOString(),
        }),
      });
      const data = (await response.json()) as { assignment?: Assignment; error?: string };
      if (!response.ok || !data.assignment) {
        setError(data.error ?? "Could not create assignment.");
        setStatus("idle");
        return;
      }

      await loadClassResults(selectedClassCode);
    } catch {
      setError("Could not create assignment.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-12 lg:px-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Create Class</h2>
        <p className="mt-1 text-sm text-slate-600">Generate a shareable class code for students to join.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            placeholder="Class name"
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={classGrade}
            onChange={(event) => setClassGrade(Number(event.target.value))}
          >
            {[7, 8, 9, 10, 11, 12].map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
          <button
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={createClass}
            disabled={status === "loading"}
          >
            Create Class
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {classes.map((teacherClass) => (
            <button
              key={teacherClass.id}
              onClick={() => {
                setSelectedClassCode(teacherClass.class_code);
                setAssignmentGrade(teacherClass.grade);
              }}
              className={`rounded-xl border p-3 text-left ${
                selectedClassCode === teacherClass.class_code
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="font-semibold text-slate-900">{teacherClass.class_name}</p>
              <p className="text-sm text-slate-600">Code: {teacherClass.class_code}</p>
              <p className="text-sm text-slate-600">
                Grade {teacherClass.grade} - {teacherClass.student_count} students
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">My quiz questions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Write multiple-choice items for a grade and subject. Students who have joined one of your classes will see
          up to four of your questions mixed into their quizzes for that subject (alongside the main question bank).
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="tq-grade">
              Grade
            </label>
            <select
              id="tq-grade"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={questionBankGrade}
              onChange={(event) => setQuestionBankGrade(Number(event.target.value))}
            >
              {QUESTION_BANK_GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="tq-subject">
              Subject
            </label>
            <select
              id="tq-subject"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={questionBankSubjectId ?? ""}
              onChange={(event) => setQuestionBankSubjectId(Number(event.target.value))}
            >
              {questionBankSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <textarea
              placeholder="Question"
              className="min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={tqForm.question}
              onChange={(event) => setTqForm((prev) => ({ ...prev, question: event.target.value }))}
            />
            <input
              placeholder="Option A"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={tqForm.optionA}
              onChange={(event) => setTqForm((prev) => ({ ...prev, optionA: event.target.value }))}
            />
            <input
              placeholder="Option B"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={tqForm.optionB}
              onChange={(event) => setTqForm((prev) => ({ ...prev, optionB: event.target.value }))}
            />
            <input
              placeholder="Option C"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={tqForm.optionC}
              onChange={(event) => setTqForm((prev) => ({ ...prev, optionC: event.target.value }))}
            />
            <input
              placeholder="Option D"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={tqForm.optionD}
              onChange={(event) => setTqForm((prev) => ({ ...prev, optionD: event.target.value }))}
            />
            <input
              placeholder="Correct answer (must match one option exactly)"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={tqForm.answer}
              onChange={(event) => setTqForm((prev) => ({ ...prev, answer: event.target.value }))}
            />
            <textarea
              placeholder="Explanation"
              className="min-h-20 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={tqForm.explanation}
              onChange={(event) => setTqForm((prev) => ({ ...prev, explanation: event.target.value }))}
            />
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={tqForm.difficulty}
              onChange={(event) =>
                setTqForm((prev) => ({
                  ...prev,
                  difficulty: event.target.value as "easy" | "medium" | "hard",
                }))
              }
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={tqStatus === "loading" || !questionBankSubjectId}
                onClick={() => void saveTeacherQuestion()}
              >
                {tqForm.id ? "Update question" : "Add question"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                onClick={clearTqForm}
              >
                New question
              </button>
            </div>
            {tqError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{tqError}</p>}
            {tqSuccess && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{tqSuccess}</p>}
          </div>

          <div className="max-h-[480px] space-y-2 overflow-auto rounded border border-slate-200 p-2">
            {myQuestions.map((q) => (
              <article key={q.id} className="rounded border border-slate-200 p-2 text-sm">
                <p className="font-medium text-slate-900">{q.question}</p>
                <p className="mt-1 text-xs text-slate-600">Answer: {q.answer}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded bg-slate-800 px-2 py-1 text-xs text-white"
                    onClick={() => fillTqFromQuestion(q)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800"
                    onClick={() => void deleteTeacherQuestion(q.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {myQuestions.length === 0 && (
              <p className="text-sm text-slate-600">No questions yet for this grade and subject.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Assign Quiz</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={selectedClassCode}
            onChange={(event) => setSelectedClassCode(event.target.value)}
          >
            <option value="">Select class</option>
            {classes.map((teacherClass) => (
              <option key={teacherClass.id} value={teacherClass.class_code}>
                {teacherClass.class_name} ({teacherClass.class_code})
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={assignmentGrade}
            onChange={(event) => setAssignmentGrade(Number(event.target.value))}
          >
            {[7, 8, 9, 10, 11, 12].map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={assignmentSubjectId ?? ""}
            onChange={(event) => setAssignmentSubjectId(Number(event.target.value))}
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={createAssignment}
            disabled={!selectedClassCode || !assignmentSubjectId || !dueDate || status === "loading"}
          >
            Assign Quiz
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {assignments.slice(0, 5).map((assignment) => (
            <div key={assignment.id} className="rounded-lg border border-slate-200 p-2 text-sm">
              {assignment.subject} - Grade {assignment.grade} - due{" "}
              {new Date(assignment.due_date).toLocaleString()}
            </div>
          ))}
          {assignments.length === 0 && <p className="text-sm text-slate-600">No assignments yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Class Results</h2>
        <p className="mt-1 text-sm text-slate-600">Per-student performance and weak-area indicators.</p>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-4 space-y-2">
          {results.map((result) => (
            <article key={`${result.assignmentId}-${result.studentId}`} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold text-slate-900">{result.studentName}</p>
                <p className="text-sm text-slate-600">
                  {result.subject} (Grade {result.grade}) - Attempts: {result.attempts}
                </p>
              </div>
              <p className="text-sm text-slate-700">
                Average Score: {typeof result.averageScore === "number" ? `${result.averageScore}%` : "No attempts yet"}
              </p>
              {result.weakAreas[0] && <p className="text-sm text-red-700">Weak area: {result.weakAreas[0]}</p>}
            </article>
          ))}
          {results.length === 0 && <p className="text-sm text-slate-600">No class results yet.</p>}
        </div>
      </section>
    </div>
  );
}
