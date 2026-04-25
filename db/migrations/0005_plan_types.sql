ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_plan_check;

UPDATE users
SET plan = 'single_child'
WHERE plan = 'premium';

ALTER TABLE users
ADD CONSTRAINT users_plan_check
CHECK (plan IN ('free', 'single_child', 'family_3_children', 'teachers_schools', 'one_time_use'));
