-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('RECEIVED', 'SENT');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'SENT';
