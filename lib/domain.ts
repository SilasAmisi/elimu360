export const USER_ROLES = ["student", "parent", "teacher", "admin"] as const;
export const USER_PLANS = ["free", "premium"] as const;

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
