CREATE TABLE IF NOT EXISTS family_access_codes (
  parent_id BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_access_codes_code ON family_access_codes (code);

CREATE TABLE IF NOT EXISTS student_family_redemptions (
  student_id BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  parent_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_family_parent ON student_family_redemptions (parent_id);
