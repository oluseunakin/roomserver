/*
  Warnings:

  - You are about to drop the column `agree` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `commentsCount` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `disagree` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `messageId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `Trends` table. All the data in the column will be lost.
  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `roomId` on table `Conversation` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `receiverId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_messageId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_talkerId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_messageId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Trends" DROP CONSTRAINT "Trends_roomId_fkey";

-- DropIndex
DROP INDEX "Conversation_messageId_key";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "agree",
DROP COLUMN "commentsCount",
DROP COLUMN "disagree",
DROP COLUMN "messageId",
ALTER COLUMN "roomId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "media" TEXT[],
ADD COLUMN     "receiverId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Trends" DROP COLUMN "roomId";

-- DropTable
DROP TABLE "Media";

-- CreateTable
CREATE TABLE "_agree" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_disagree" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_agree_AB_unique" ON "_agree"("A", "B");

-- CreateIndex
CREATE INDEX "_agree_B_index" ON "_agree"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_disagree_AB_unique" ON "_disagree"("A", "B");

-- CreateIndex
CREATE INDEX "_disagree_B_index" ON "_disagree"("B");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_talkerId_fkey" FOREIGN KEY ("talkerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_agree" ADD CONSTRAINT "_agree_A_fkey" FOREIGN KEY ("A") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_agree" ADD CONSTRAINT "_agree_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_disagree" ADD CONSTRAINT "_disagree_A_fkey" FOREIGN KEY ("A") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_disagree" ADD CONSTRAINT "_disagree_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
