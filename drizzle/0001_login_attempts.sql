CREATE TABLE "daily_tab"."login_attempts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "daily_tab"."login_attempts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ip" text NOT NULL,
	"succeeded" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "login_attempts_created_at_idx" ON "daily_tab"."login_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_created_at_idx" ON "daily_tab"."login_attempts" USING btree ("ip","created_at");