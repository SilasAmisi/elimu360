import { sql } from "@/lib/db";

type QuotaWindow = {
  key: string;
  windowMs: number;
  maxCalls: number;
};

function floorToWindow(nowMs: number, windowMs: number) {
  return new Date(Math.floor(nowMs / windowMs) * windowMs).toISOString();
}

async function consumeQuota(window: QuotaWindow): Promise<boolean> {
  const rows = (await sql.query(
    `INSERT INTO ai_usage_guardrails (quota_key, window_start, call_count, last_hit_at)
     VALUES ($1, $2, 1, NOW())
     ON CONFLICT (quota_key, window_start)
     DO UPDATE SET
       call_count = ai_usage_guardrails.call_count + 1,
       last_hit_at = NOW()
     RETURNING call_count`,
    [window.key, floorToWindow(Date.now(), window.windowMs)],
  )) as Array<{ call_count: number }>;

  const count = rows[0]?.call_count ?? 0;
  return count <= window.maxCalls;
}

export type AllowAiQuestionGenerationOptions = {
  /**
   * Admin-triggered bulk generation: skips tight per-subject hourly limits so curators
   * can seed the bank; still enforces global daily cap and a per-admin hourly cap.
   */
  mode?: "default" | "admin-bulk";
  adminUserId?: number;
};

export async function allowAiQuestionGeneration(
  params: {
    requesterKey: string;
    subjectId: number;
    grade: number;
  },
  options?: AllowAiQuestionGenerationOptions,
) {
  const mode = options?.mode ?? "default";

  const limits: QuotaWindow[] =
    mode === "admin-bulk" && typeof options?.adminUserId === "number"
      ? [
          {
            key: "global:day",
            windowMs: 24 * 60 * 60 * 1000,
            maxCalls: 300,
          },
          {
            key: `admin:user:hour:${options.adminUserId}`,
            windowMs: 60 * 60 * 1000,
            maxCalls: 40,
          },
        ]
      : [
          {
            key: "global:day",
            windowMs: 24 * 60 * 60 * 1000,
            maxCalls: 300,
          },
          {
            key: `subject-grade:hour:${params.subjectId}:${params.grade}`,
            windowMs: 60 * 60 * 1000,
            maxCalls: 4,
          },
          {
            key: `requester:hour:${params.requesterKey}`,
            windowMs: 60 * 60 * 1000,
            maxCalls: 10,
          },
        ];

  for (const limit of limits) {
    const allowed = await consumeQuota(limit);
    if (!allowed) {
      return {
        allowed: false,
        reason: "AI generation limit reached. Please retry shortly.",
      };
    }
  }

  return { allowed: true };
}
