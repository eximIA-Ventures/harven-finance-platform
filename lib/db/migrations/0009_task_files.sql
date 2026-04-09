-- Multiple files per task (admin-uploaded materials, slides, videos, etc.)
CREATE TABLE IF NOT EXISTS "task_files" (
  "id" text PRIMARY KEY NOT NULL,
  "task_id" text NOT NULL REFERENCES "journey_tasks"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "file_url" text NOT NULL,
  "file_name" text NOT NULL,
  "file_type" text,
  "file_size" integer,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" text NOT NULL
);
