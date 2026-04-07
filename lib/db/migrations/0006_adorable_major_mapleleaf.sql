ALTER TABLE "wiki_pages" ADD COLUMN "resource_type" text DEFAULT 'article';--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "file_type" text;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "cover_color" text DEFAULT '#C4A882';--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "tags" text;