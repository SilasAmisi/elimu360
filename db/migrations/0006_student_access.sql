ALTER TABLE users
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS student_public_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS student_access_code_hash TEXT,
ADD COLUMN IF NOT EXISTS student_access_code_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS manager_students (
  manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (manager_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_access_sessions (
  token TEXT PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_access_sessions_student_id
  ON student_access_sessions (student_id);
