export const USER_ROLES = ["student", "parent", "teacher", "admin"] as const;
export const USER_PLANS = [
  "free",
  "single_child",
  "family_3_children",
  "teachers_schools",
  "one_time_use",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserPlan = (typeof USER_PLANS)[number];

export const CBC_SUBJECTS = [
  "Mathematics",
  "English",
  "Kiswahili",
  "Science",
  "Social Studies",
  "CRE",
  "Business Studies",
  "Geography",
  "History",
  "Biology",
  "Chemistry",
  "Physics",
] as const;

export type CbcSubject = (typeof CBC_SUBJECTS)[number];

export const SUBJECTS_BY_GRADE: Record<number, CbcSubject[]> = {
  1: ["Mathematics", "English", "Kiswahili", "Science", "Social Studies", "CRE"],
  2: ["Mathematics", "English", "Kiswahili", "Science", "Social Studies", "CRE"],
  3: ["Mathematics", "English", "Kiswahili", "Science", "Social Studies", "CRE"],
  4: ["Mathematics", "English", "Kiswahili", "Science", "Social Studies", "CRE"],
  5: ["Mathematics", "English", "Kiswahili", "Science", "Social Studies", "CRE"],
  6: ["Mathematics", "English", "Kiswahili", "Science", "Social Studies", "CRE"],
  7: [
    "Mathematics",
    "English",
    "Kiswahili",
    "Science",
    "Social Studies",
    "CRE",
    "Business Studies",
    "Geography",
    "History",
  ],
  8: [
    "Mathematics",
    "English",
    "Kiswahili",
    "Science",
    "Social Studies",
    "CRE",
    "Business Studies",
    "Geography",
    "History",
  ],
  9: [
    "Mathematics",
    "English",
    "Kiswahili",
    "Science",
    "Social Studies",
    "CRE",
    "Business Studies",
    "Geography",
    "History",
  ],
  10: [...CBC_SUBJECTS],
  11: [...CBC_SUBJECTS],
  12: [...CBC_SUBJECTS],
};

export function getSubjectsForGrade(grade: number): CbcSubject[] {
  return SUBJECTS_BY_GRADE[grade] ?? SUBJECTS_BY_GRADE[7];
}
