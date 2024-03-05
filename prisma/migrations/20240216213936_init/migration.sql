/*
  Warnings:

  - Added the required column `convo` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "convo" TEXT NOT NULL,
ADD COLUMN     "media" TEXT[];
