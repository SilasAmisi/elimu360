import { allowAiQuestionGeneration } from "@/lib/ai-guardrails";
import { getTeacherIdsLinkedToStudent } from "@/lib/class-teachers";
import { sql } from "@/lib/db";
import { upsertAiQuestionsForSubjectGrade } from "@/lib/persist-ai-questions";
import { pgInt8 } from "@/lib/pg-int";
import { generateAiQuestions } from "@/lib/quiz";

type DbQuestion = {
  id: number;
  question: string;
  options: string[];
  difficulty: string;
};

const QUIZ_SIZE = 10;
/** Max teacher-authored items mixed into one quiz (rest from hardcoded / AI). */
const TEACHER_BANK_CAP = 4;

function normalizeDeliveredQuestion(row: DbQuestion): DbQuestion {
  const rawOpts = row.options as unknown;
  let options: string[] = [];
  if (Array.isArray(rawOpts)) {
    options = rawOpts as string[];
  } else if (typeof rawOpts === "string") {
    try {
      const parsed = JSON.parse(rawOpts) as unknown;
      options = Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      options = [];
    }
  }
  return {
    ...row,
    id: pgInt8(row.id as unknown),
    options,
  };
}

async function loadTeacherQuestionSlice(params: {
  studentUserId: number | null | undefined;
  subjectId: number;
  grade: number;
  cap: number;
}): Promise<DbQuestion[]> {
  if (params.studentUserId == null) return [];
  const teacherIds = await getTeacherIdsLinkedToStudent(params.studentUserId);
  if (teacherIds.length === 0) return [];

  return (await sql.query(
    `SELECT id, question, options, difficulty
     FROM questions
     WHERE subject_id = $1
       AND grade = $2
       AND source = 'teacher'
       AND author_user_id = ANY($3::bigint[])
     ORDER BY RANDOM()
     LIMIT $4`,
    [params.subjectId, params.grade, teacherIds, params.cap],
  )) as DbQuestion[];
}

export async function getQuizQuestionsForSession(params: {
  subjectId: number;
  subjectName: string;
  grade: number;
  requesterKey: string;
  /** When set (student taking a quiz), includes questions from teachers whose classes this student joined. */
  studentUserId?: number | null;
}) {
  const teacherPart = await loadTeacherQuestionSlice({
    studentUserId: params.studentUserId,
    subjectId: params.subjectId,
    grade: params.grade,
    cap: TEACHER_BANK_CAP,
  });
  const teacherBoost = teacherPart.length > 0;

  const needFromHardcoded = QUIZ_SIZE - teacherPart.length;
  const hardcoded = (await sql.query(
    `SELECT id, question, options, difficulty
     FROM questions
     WHERE subject_id = $1 AND grade = $2 AND source = 'hardcoded'
     ORDER BY RANDOM()
     LIMIT $3`,
    [params.subjectId, params.grade, needFromHardcoded],
  )) as DbQuestion[];

  let combined = [...teacherPart, ...hardcoded];

  if (combined.length >= QUIZ_SIZE) {
    return {
      source: teacherBoost ? "mixed-teacher-hardcoded" : "hardcoded",
      questions: combined.slice(0, QUIZ_SIZE).map(normalizeDeliveredQuestion),
    };
  }

  const remainingAfterHardcoded = QUIZ_SIZE - combined.length;
  const cachedAi = (await sql.query(
    `SELECT id, question, options, difficulty
     FROM questions
     WHERE subject_id = $1
       AND grade = $2
       AND source = 'ai'
       AND generated_at >= NOW() - INTERVAL '30 days'
     ORDER BY generated_at DESC
     LIMIT $3`,
    [params.subjectId, params.grade, remainingAfterHardcoded],
  )) as DbQuestion[];

  combined = [...combined, ...cachedAi];
  if (combined.length >= QUIZ_SIZE) {
    return {
      source: teacherBoost ? "mixed-teacher-ai-cache" : "mixed-cache",
      questions: combined.slice(0, QUIZ_SIZE).map(normalizeDeliveredQuestion),
    };
  }

  const stillNeeded = QUIZ_SIZE - combined.length;
  const guardrail = await allowAiQuestionGeneration({
    requesterKey: params.requesterKey,
    subjectId: params.subjectId,
    grade: params.grade,
  });

  if (!guardrail.allowed) {
    return {
      source: "limited",
      questions: combined.map(normalizeDeliveredQuestion),
      warning: guardrail.reason,
    };
  }

  let generated;
  try {
    generated = await generateAiQuestions({
      subjectName: params.subjectName,
      grade: params.grade,
      count: stillNeeded,
    });
  } catch {
    return {
      source: "limited",
      questions: combined.map(normalizeDeliveredQuestion),
      warning: "Could not generate more questions right now. Try again later or pick another subject.",
    };
  }

  await upsertAiQuestionsForSubjectGrade({
    subjectId: params.subjectId,
    grade: params.grade,
    items: generated,
  });

  const freshAi = (await sql.query(
    `SELECT id, question, options, difficulty
     FROM questions
     WHERE subject_id = $1
       AND grade = $2
       AND source = 'ai'
       AND generated_at >= NOW() - INTERVAL '30 days'
     ORDER BY generated_at DESC
     LIMIT $3`,
    [params.subjectId, params.grade, stillNeeded],
  )) as DbQuestion[];

  combined = [...combined, ...freshAi].slice(0, QUIZ_SIZE);
  return {
    source: teacherBoost ? "mixed-teacher-ai-fresh" : hardcoded.length > 0 ? "mixed-fresh" : "ai-fresh",
    questions: combined.map(normalizeDeliveredQuestion),
  };
}
