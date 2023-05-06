/*
  Warnings:

  - Added the required column `agree` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disagree` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "agree" INTEGER NOT NULL,
ADD COLUMN     "disagree" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "usercount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
