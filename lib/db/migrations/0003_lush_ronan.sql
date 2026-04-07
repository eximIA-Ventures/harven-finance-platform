CREATE TABLE "journey_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"journey_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active',
	"start_date" text NOT NULL,
	"end_date" text,
	"mentor_id" text,
	"nucleus_id" text,
	"metadata" text,
	"created_by" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'participant',
	"status" text DEFAULT 'active',
	"current_stage_id" text,
	"completed_at" text,
	"joined_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"journey_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer NOT NULL,
	"color" text DEFAULT '#C4A882',
	"estimated_days" integer,
	"unlock_rule" text DEFAULT 'sequential'
);
--> statement-breakpoint
CREATE TABLE "journey_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"stage_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer NOT NULL,
	"task_type" text DEFAULT 'text' NOT NULL,
	"is_required" integer DEFAULT 1,
	"review_type" text DEFAULT 'mentor',
	"config" text,
	"max_score" real DEFAULT 10,
	"weight" real DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "journeys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"journey_type" text DEFAULT 'custom',
	"color" text DEFAULT '#C4A882',
	"icon" text DEFAULT 'route',
	"estimated_days" integer,
	"is_template" integer DEFAULT 1,
	"created_by" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"reviewer_id" text,
	"review_type" text NOT NULL,
	"score" real,
	"feedback" text,
	"status" text DEFAULT 'completed',
	"ai_output" text,
	"reviewed_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text,
	"file_url" text,
	"file_name" text,
	"link_url" text,
	"status" text DEFAULT 'submitted',
	"score" real,
	"submitted_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journey_instances" ADD CONSTRAINT "journey_instances_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_participants" ADD CONSTRAINT "journey_participants_instance_id_journey_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."journey_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_stages" ADD CONSTRAINT "journey_stages_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_tasks" ADD CONSTRAINT "journey_tasks_stage_id_journey_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."journey_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_submission_id_task_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."task_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_instance_id_journey_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."journey_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_task_id_journey_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."journey_tasks"("id") ON DELETE no action ON UPDATE no action;