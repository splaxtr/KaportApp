-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "tcVkn" TEXT;

-- CreateIndex
CREATE INDEX "Customer_tcVkn_idx" ON "Customer"("tcVkn");
