-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_trendId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "trendId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trends"("id") ON DELETE SET NULL ON UPDATE CASCADE;
