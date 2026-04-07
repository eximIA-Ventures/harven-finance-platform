CREATE TABLE "kanban_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo',
	"priority" text DEFAULT 'medium',
	"assignee_id" text,
	"stage_id" text,
	"due_date" text,
	"sort_order" integer DEFAULT 0,
	"created_by" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_instance_id_journey_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."journey_instances"("id") ON DELETE no action ON UPDATE no action;