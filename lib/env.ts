import { z } from "zod";

export function getDatabaseUrl() {
  return z.string().url().parse(process.env.DATABASE_URL);
}

export function getOpenAiApiKey() {
  const value = process.env.OPENAI_API_KEY;
  return typeof value === "string" && value.length > 0 ? value : null;
}
