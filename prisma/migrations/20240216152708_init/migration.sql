/*
  Warnings:

  - A unique constraint covering the columns `[topic]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `topic` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "topic" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Room_topic_key" ON "Room"("topic");
