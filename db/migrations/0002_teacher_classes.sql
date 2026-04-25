CREATE TABLE IF NOT EXISTS teacher_classes (
  id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  class_code TEXT NOT NULL UNIQUE,
  grade INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher_id
  ON teacher_classes (teacher_id, created_at DESC);
