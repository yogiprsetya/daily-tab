CREATE TABLE "daily_tab"."bookmark_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_tab"."bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"notes" text,
	"folder_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_tab"."bookmarks" ADD CONSTRAINT "bookmarks_folder_id_bookmark_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "daily_tab"."bookmark_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_folders_name_lower_idx" ON "daily_tab"."bookmark_folders" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_url_idx" ON "daily_tab"."bookmarks" USING btree ("url");--> statement-breakpoint
CREATE INDEX "bookmarks_created_at_idx" ON "daily_tab"."bookmarks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bookmarks_folder_id_idx" ON "daily_tab"."bookmarks" USING btree ("folder_id");