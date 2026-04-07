CREATE TABLE "ai_results" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"scores" text NOT NULL,
	"section_scores" text NOT NULL,
	"final_score" real NOT NULL,
	"profile" text,
	"feedback" text,
	"suggested_questions" text,
	"evaluated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"evaluation_id" text NOT NULL,
	"team_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"group_name" text,
	"magic_token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organizer" text,
	"description" text,
	"competition_type" text DEFAULT 'case',
	"start_date" text,
	"end_date" text,
	"result" text,
	"placement" text,
	"team_members" text,
	"documents" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consolidated_results" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"phase_id" text NOT NULL,
	"ai_score" real,
	"human_score" real,
	"human_review_count" integer DEFAULT 0,
	"divergence" real,
	"final_score" real,
	"classification" text,
	"divergence_flag" text,
	"feedback" text,
	"feedback_sent" integer DEFAULT 0,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "criteria" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"weight" real NOT NULL,
	"sort_order" integer NOT NULL,
	"rubric" text
);
--> statement-breakpoint
CREATE TABLE "cutoffs" (
	"id" text PRIMARY KEY NOT NULL,
	"evaluation_id" text NOT NULL,
	"label" text NOT NULL,
	"min_score" real NOT NULL,
	"action" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"description" text,
	"instructions" text,
	"case_file_url" text,
	"case_file_name" text,
	"deadline" text,
	"max_score" real DEFAULT 10 NOT NULL,
	"admin_password" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_attendees" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'registered',
	"checked_in_at" text,
	"registered_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_type" text DEFAULT 'meeting',
	"location" text,
	"start_date" text NOT NULL,
	"end_date" text,
	"speaker" text,
	"speaker_title" text,
	"max_attendees" integer,
	"created_by" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "human_evaluators" (
	"id" text PRIMARY KEY NOT NULL,
	"evaluation_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"access_token" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "human_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"evaluator_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"analytical_score" real NOT NULL,
	"reasoning_score" real NOT NULL,
	"originality_score" real NOT NULL,
	"communication_score" real NOT NULL,
	"overall_score" real NOT NULL,
	"impression" text,
	"recommendation" text NOT NULL,
	"reviewed_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nuclei" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#C4A882',
	"coordinator_id" text,
	"created_at" text NOT NULL,
	CONSTRAINT "nuclei_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "nucleus_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"nucleus_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"semester" text NOT NULL,
	"status" text DEFAULT 'active',
	"company" text,
	"ticker" text,
	"deliverable_type" text,
	"due_date" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phases" (
	"id" text PRIMARY KEY NOT NULL,
	"evaluation_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"weight" real NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_positions" (
	"id" text PRIMARY KEY NOT NULL,
	"nucleus_id" text,
	"ticker" text NOT NULL,
	"company_name" text NOT NULL,
	"position_type" text DEFAULT 'long',
	"entry_date" text NOT NULL,
	"entry_price" real NOT NULL,
	"quantity" real DEFAULT 0,
	"current_price" real,
	"exit_date" text,
	"exit_price" real,
	"thesis" text,
	"thesis_author" text,
	"status" text DEFAULT 'open',
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_deliverables" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"file_url" text,
	"file_name" text,
	"file_type" text,
	"notes" text,
	"uploaded_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"phase_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"weight" real NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"team_id" text,
	"phase_id" text NOT NULL,
	"file_url" text,
	"file_name" text,
	"raw_text" text,
	"ai_usage" text,
	"ai_usage_description" text,
	"submitted_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"evaluation_id" text NOT NULL,
	"number" integer NOT NULL,
	"draw_seed" text,
	"drawn_at" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'candidate' NOT NULL,
	"evaluation_id" text,
	"candidate_id" text,
	"permissions" text DEFAULT '[]',
	"created_at" text NOT NULL,
	"avatar_url" text,
	"course" text,
	"semester" text,
	"member_status" text DEFAULT 'trainee',
	"nucleus_id" text,
	"joined_at" text,
	"linkedin_url" text,
	"bio" text,
	"points" integer DEFAULT 0,
	"ano_ingresso" text,
	"sala" text,
	"instagram" text,
	"telefone" text,
	"empresa" text,
	"cargo_empresa" text,
	"empresa_site" text,
	"empresa_linkedin" text,
	"empresa_descricao" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wiki_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text,
	"category" text DEFAULT 'general',
	"parent_id" text,
	"author_id" text,
	"is_published" integer DEFAULT 1,
	"sort_order" integer DEFAULT 0,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_results" ADD CONSTRAINT "ai_results_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidated_results" ADD CONSTRAINT "consolidated_results_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidated_results" ADD CONSTRAINT "consolidated_results_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cutoffs" ADD CONSTRAINT "cutoffs_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_evaluators" ADD CONSTRAINT "human_evaluators_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_reviews" ADD CONSTRAINT "human_reviews_evaluator_id_human_evaluators_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."human_evaluators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_reviews" ADD CONSTRAINT "human_reviews_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nucleus_projects" ADD CONSTRAINT "nucleus_projects_nucleus_id_nuclei_id_fk" FOREIGN KEY ("nucleus_id") REFERENCES "public"."nuclei"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phases" ADD CONSTRAINT "phases_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_nucleus_id_nuclei_id_fk" FOREIGN KEY ("nucleus_id") REFERENCES "public"."nuclei"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_deliverables" ADD CONSTRAINT "project_deliverables_project_id_nucleus_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."nucleus_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE no action ON UPDATE no action;