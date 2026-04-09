-- Add material upload and release control to journey tasks
ALTER TABLE "journey_tasks" ADD COLUMN "material_url" text;
ALTER TABLE "journey_tasks" ADD COLUMN "material_file_name" text;
ALTER TABLE "journey_tasks" ADD COLUMN "material_file_size" integer;
ALTER TABLE "journey_tasks" ADD COLUMN "is_released" integer DEFAULT 1;

-- Quiz questions table for quiz-type tasks
CREATE TABLE IF NOT EXISTS "quiz_questions" (
  "id" text PRIMARY KEY NOT NULL,
  "task_id" text NOT NULL REFERENCES "journey_tasks"("id") ON DELETE CASCADE,
  "question" text NOT NULL,
  "question_type" text NOT NULL DEFAULT 'multiple_choice',
  "options" text,
  "correct_answer" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "points" real DEFAULT 1
);
