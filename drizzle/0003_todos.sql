CREATE TABLE "daily_tab"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_tab"."todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"project_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_tab"."todos" ADD CONSTRAINT "todos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "daily_tab"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_name_lower_idx" ON "daily_tab"."projects" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "todos_completed_at_created_at_idx" ON "daily_tab"."todos" USING btree ("completed_at","created_at");--> statement-breakpoint
CREATE INDEX "todos_project_id_idx" ON "daily_tab"."todos" USING btree ("project_id");