-- Add credit fields to user table
ALTER TABLE "user" ADD COLUMN "credits" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN "totalCreditsEarned" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN "totalCreditsUsed" integer DEFAULT 0 NOT NULL;

-- Create credit transaction table
CREATE TABLE "credit_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"messageId" uuid,
	"stripePaymentIntentId" text,
	"couponCode" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add constraints
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Add check constraint for transaction type
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_type_check" CHECK ("type" IN ('purchase', 'usage', 'bonus', 'refund'));

-- Create index for userId on credit_transaction table for better query performance
CREATE INDEX "credit_transaction_userId_idx" ON "credit_transaction" ("userId");
CREATE INDEX "credit_transaction_createdAt_idx" ON "credit_transaction" ("createdAt");