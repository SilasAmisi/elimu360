import { CBC_SUBJECTS, type CbcSubject } from "./domain";

type SeedQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};

const TOPICS_BY_SUBJECT: Record<CbcSubject, string[]> = {
  Mathematics: [
    "fractions",
    "algebraic expressions",
    "linear equations",
    "geometry and angles",
    "ratios and proportions",
    "percentages",
    "statistics",
    "probability",
    "trigonometry basics",
    "mensuration",
  ],
  English: [
    "parts of speech",
    "subject-verb agreement",
    "comprehension",
    "vocabulary in context",
    "direct and indirect speech",
    "tenses",
    "composition structure",
    "punctuation",
    "summary writing",
    "literary devices",
  ],
  Kiswahili: [
    "sarufi ya nomino",
    "ngeli za nomino",
    "uandishi wa insha",
    "ufahamu wa matini",
    "methali",
    "nahau",
    "vitenzi",
    "matumizi ya vihusishi",
    "vipengele vya hadithi",
    "mjadala",
  ],
  Science: [
    "human body systems",
    "plants and photosynthesis",
    "states of matter",
    "forces and motion",
    "energy forms",
    "simple machines",
    "electric circuits",
    "weather and climate",
    "ecosystems",
    "health and nutrition",
  ],
  "Social Studies": [
    "map reading",
    "governance",
    "citizenship",
    "natural resources",
    "transport and communication",
    "population studies",
    "trade and industry",
    "East African community",
    "environmental conservation",
    "historical timelines",
  ],
  CRE: [
    "creation stories",
    "the Ten Commandments",
    "Old Testament prophets",
    "teachings of Jesus",
    "parables",
    "miracles",
    "Christian values",
    "church history",
    "Christian service",
    "family life education",
  ],
  "Business Studies": [
    "forms of business ownership",
    "factors of production",
    "demand and supply",
    "market structures",
    "business finance",
    "bookkeeping",
    "entrepreneurship",
    "insurance",
    "office practice",
    "consumer protection",
  ],
  Geography: [
    "weather instruments",
    "climate regions",
    "map interpretation",
    "plate tectonics",
    "drainage systems",
    "vegetation zones",
    "soil formation",
    "population distribution",
    "urbanization",
    "resource management",
  ],
  History: [
    "early human societies",
    "migration patterns",
    "pre-colonial communities",
    "colonial administration",
    "nationalism",
    "independence struggle",
    "constitution making",
    "regional cooperation",
    "global conflicts",
    "leadership and governance",
  ],
  Biology: [
    "cell structure",
    "nutrition",
    "transport in plants",
    "transport in animals",
    "respiration",
    "excretion",
    "reproduction",
    "genetics",
    "ecology",
    "classification of organisms",
  ],
  Chemistry: [
    "laboratory safety",
    "separation techniques",
    "atomic structure",
    "periodic table",
    "chemical bonding",
    "acids and bases",
    "salts",
    "rates of reaction",
    "gas laws",
    "electrolysis",
  ],
  Physics: [
    "measurement and units",
    "motion",
    "forces",
    "pressure",
    "heat transfer",
    "waves",
    "light",
    "electricity",
    "magnetism",
    "energy conversion",
  ],
};

function difficultyForGrade(grade: number): "easy" | "medium" | "hard" {
  if (grade <= 8) return "easy";
  if (grade <= 10) return "medium";
  return "hard";
}

function createQuestion(
  subject: CbcSubject,
  grade: number,
  topic: string,
  idx: number,
): SeedQuestion {
  const stem = `Grade ${grade} ${subject}: Which statement is most accurate about ${topic}?`;
  const correct = `The core concept of ${topic} is applied correctly in this context.`;

  return {
    question: `${stem} (Q${idx + 1})`,
    options: [
      correct,
      `The concept of ${topic} can be ignored for this type of problem.`,
      `Only memorization is needed; understanding ${topic} is unnecessary.`,
      `${topic} is unrelated to Grade ${grade} ${subject} competencies.`,
    ],
    answer: correct,
    explanation: `In CBC learning, ${topic} must be understood and applied. The correct option reflects practical understanding expected at Grade ${grade}.`,
    difficulty: difficultyForGrade(grade),
  };
}

export function buildSeedQuestions() {
  const grades = [7, 8, 9, 10, 11, 12];

  return grades.flatMap((grade) =>
    CBC_SUBJECTS.flatMap((subject) =>
      TOPICS_BY_SUBJECT[subject].map((topic, idx) => ({
        subject,
        grade,
        ...createQuestion(subject, grade, topic, idx),
      })),
    ),
  );
}
