ALTER TABLE "events" ADD COLUMN "meeting_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "location_type" text DEFAULT 'presencial';