-- Customer email verification.
-- Existing rows keep emailVerified = false; only customer accounts are gated
-- on this flag, so admin logins are unaffected.

ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationExpires" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
