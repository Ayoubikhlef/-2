-- Add resetToken and resetTokenExpires columns to User table
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetTokenExpires" DATETIME;

-- Create index on resetToken for faster lookups
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");