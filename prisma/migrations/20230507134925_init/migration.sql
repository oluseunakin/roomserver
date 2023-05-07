/*
  Warnings:

  - You are about to drop the column `trendsId` on the `Room` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Trends" DROP CONSTRAINT "Trends_roomId_fkey";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "trendsId";

-- AddForeignKey
ALTER TABLE "Trends" ADD CONSTRAINT "Trends_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
