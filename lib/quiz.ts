import OpenAI from "openai";
import { z } from "zod";

import { getOpenAiApiKey } from "@/lib/env";

const aiQuestionSchema = z.object({
  question: z.string().min(10),
  options: z.array(z.string().min(1)).length(4),
  answer: z.string().min(1),
  explanation: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

const aiPayloadSchema = z.object({
  questions: z.array(aiQuestionSchema).min(1).max(10),
});

const openAiApiKey = getOpenAiApiKey();
const client = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

export type QuizQuestion = z.infer<typeof aiQuestionSchema>;

export async function generateAiQuestions(params: {
  subjectName: string;
  grade: number;
  count: number;
}): Promise<QuizQuestion[]> {
  if (!client) {
    throw new Error("OPENAI_API_KEY is missing; cannot generate AI questions.");
  }

  const count = Math.min(Math.max(params.count, 1), 10);

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_tokens: 1800,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You create Kenyan CBC-aligned multiple choice quizzes for grades 1-12. Return strict JSON only. No harmful, sexual, political, or hateful content.",
      },
      {
        role: "user",
        content: `Generate exactly ${count} multiple-choice questions for Grade ${params.grade} ${params.subjectName}.
Return this JSON shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "one of options",
      "explanation": "short rationale",
      "difficulty": "easy|medium|hard"
    }
  ]
}
Rules:
- CBC-aligned and age-appropriate for the stated grade (1-12).
- 4 options each.
- Answer must exactly match one option.
- Keep explanations concise.
- Avoid repeating the same question idea.
- School-safe content only.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("OpenAI returned an empty response.");
  }

  const normalized = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  const parsed = aiPayloadSchema.parse(JSON.parse(normalized));
  if (parsed.questions.length === 0) {
    throw new Error("OpenAI returned no questions.");
  }

  return parsed.questions.slice(0, count);
}
