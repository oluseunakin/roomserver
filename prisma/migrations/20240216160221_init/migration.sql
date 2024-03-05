/*
  Warnings:

  - You are about to drop the column `topic` on the `Room` table. All the data in the column will be lost.
  - Added the required column `topicId` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Room_topic_key";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "topic",
ADD COLUMN     "topicId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
