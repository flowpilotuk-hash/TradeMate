-- CreateTable
CREATE TABLE "Tradesman" (
    "id" TEXT NOT NULL,
    "tradesmanId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tradesman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "tradeKind" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "fieldsJson" JSONB NOT NULL,
    "metaJson" JSONB NOT NULL,
    "budgetJson" JSONB NOT NULL,
    "classificationJson" JSONB NOT NULL,
    "auditJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tradesmanId" TEXT,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "tradeKind" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "classificationJson" JSONB NOT NULL,
    "fieldsJson" JSONB NOT NULL,
    "metaJson" JSONB NOT NULL,
    "budgetJson" JSONB NOT NULL,
    "auditJson" JSONB NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "quotedAt" TIMESTAMP(3),
    "quote" TEXT,
    "tradesmanId" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tradesman_tradesmanId_key" ON "Tradesman"("tradesmanId");

-- CreateIndex
CREATE UNIQUE INDEX "Tradesman_slug_key" ON "Tradesman"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tradesman_email_key" ON "Tradesman"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_conversationId_key" ON "Conversation"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadId_key" ON "Lead"("leadId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_tradesmanId_fkey" FOREIGN KEY ("tradesmanId") REFERENCES "Tradesman"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tradesmanId_fkey" FOREIGN KEY ("tradesmanId") REFERENCES "Tradesman"("id") ON DELETE SET NULL ON UPDATE CASCADE;
