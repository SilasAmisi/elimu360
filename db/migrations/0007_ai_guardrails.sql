CREATE TABLE IF NOT EXISTS ai_usage_guardrails (
  id BIGSERIAL PRIMARY KEY,
  quota_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quota_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_guardrails_lookup
  ON ai_usage_guardrails (quota_key, window_start DESC);
