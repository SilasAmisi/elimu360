CREATE TABLE IF NOT EXISTS parent_children (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_children_parent
  ON parent_children (parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_parent_children_student
  ON parent_children (student_id);
