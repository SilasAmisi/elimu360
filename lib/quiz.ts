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
  questions: z.array(aiQuestionSchema).length(10),
});

const openAiApiKey = getOpenAiApiKey();
const client = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

export type QuizQuestion = z.infer<typeof aiQuestionSchema>;

export async function generateAiQuestions(params: {
  subjectName: string;
  grade: number;
}): Promise<QuizQuestion[]> {
  if (!client) {
    throw new Error("OPENAI_API_KEY is missing; cannot generate AI questions.");
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You create Kenyan CBC-aligned multiple choice quizzes for grades 7-12. Return strict JSON only.",
      },
      {
        role: "user",
        content: `Generate exactly 10 multiple-choice questions for Grade ${params.grade} ${params.subjectName}.
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
- CBC-aligned and age-appropriate.
- 4 options each.
- Answer must exactly match one option.
- Keep explanations concise.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = aiPayloadSchema.parse(JSON.parse(raw));
  return parsed.questions;
}
