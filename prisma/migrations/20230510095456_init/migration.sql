/*
  Warnings:

  - The `agree` column on the `Conversation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `disagree` column on the `Conversation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "agree",
ADD COLUMN     "agree" INTEGER[],
DROP COLUMN "disagree",
ADD COLUMN     "disagree" INTEGER[];
