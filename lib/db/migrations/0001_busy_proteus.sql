ALTER TABLE "events" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "visibility" text DEFAULT 'all';