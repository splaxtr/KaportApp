-- CreateTable
CREATE TABLE "ReviewAccessKey" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "key" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,

    CONSTRAINT "ReviewAccessKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewAccessKey_tokenId_idx" ON "ReviewAccessKey"("tokenId");

-- CreateIndex
CREATE INDEX "ReviewAccessKey_usedAt_idx" ON "ReviewAccessKey"("usedAt");

-- AddForeignKey
ALTER TABLE "ReviewAccessKey" ADD CONSTRAINT "ReviewAccessKey_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "ReviewToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
