/*
  Warnings:

  - The `createdAt` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `createdAt` column on the `Notification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `usercount` on the `Room` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "createdAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "createdAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "usercount",
ADD COLUMN     "creatorId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
