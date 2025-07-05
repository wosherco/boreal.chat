ALTER TABLE "user" ADD COLUMN "subscription_status" varchar(255);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_stripeCustomerId_unique" UNIQUE("stripe_customer_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_subscriptionId_unique" UNIQUE("subscription_id");