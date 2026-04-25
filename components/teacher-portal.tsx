"use client";

import { useCallback, useEffect, useState } from "react";

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
