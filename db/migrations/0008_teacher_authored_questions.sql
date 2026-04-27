-- Teacher-authored MCQs (scoped by author; students see them when enrolled in that teacher's class)

ALTER TABLE questions ADD COLUMN IF NOT EXISTS author_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_source_check;

ALTER TABLE questions ADD CONSTRAINT questions_source_check
  CHECK (source IN ('hardcoded', 'ai', 'teacher'));

ALTER TABLE questions ADD CONSTRAINT questions_teacher_author_check
  CHECK (
    (source = 'teacher' AND author_user_id IS NOT NULL)
    OR (source <> 'teacher' AND author_user_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_questions_teacher_bank
  ON questions (subject_id, grade, source, author_user_id);
