CREATE TABLE "costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"category" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"amount" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "costs_amount_non_negative_check" CHECK ("costs"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "memory_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"image_url" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_tags_plan_id_tag_id_unique" UNIQUE("plan_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "started_at" date NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "ended_at" date NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "costs" ADD CONSTRAINT "costs_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_images" ADD CONSTRAINT "memory_images_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_tags" ADD CONSTRAINT "plan_tags_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_tags" ADD CONSTRAINT "plan_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "costs_plan_id_idx" ON "costs" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "costs_plan_id_category_idx" ON "costs" USING btree ("plan_id","category");--> statement-breakpoint
CREATE INDEX "memory_images_plan_id_created_at_idx" ON "memory_images" USING btree ("plan_id","created_at");--> statement-breakpoint
CREATE INDEX "plan_tags_tag_id_idx" ON "plan_tags" USING btree ("tag_id");