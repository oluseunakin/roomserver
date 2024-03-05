-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "type" "RoomType" NOT NULL DEFAULT 'OPEN';
