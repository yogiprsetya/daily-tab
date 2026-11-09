CREATE TABLE "daily_tab"."reading_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"notes" text,
	"topic_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_tab"."reading_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_tab"."reading_items" ADD CONSTRAINT "reading_items_topic_id_reading_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "daily_tab"."reading_topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reading_items_url_idx" ON "daily_tab"."reading_items" USING btree ("url");--> statement-breakpoint
CREATE INDEX "reading_items_created_at_idx" ON "daily_tab"."reading_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reading_items_topic_id_idx" ON "daily_tab"."reading_items" USING btree ("topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reading_topics_name_lower_idx" ON "daily_tab"."reading_topics" USING btree (lower("name"));