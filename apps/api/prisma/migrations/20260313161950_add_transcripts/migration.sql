/*
  Warnings:

  - Added the required column `messagesJson` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conversationMessagesJson` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "messagesJson" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "conversationMessagesJson" JSONB NOT NULL;
