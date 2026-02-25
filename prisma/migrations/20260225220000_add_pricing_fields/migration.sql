-- AlterTable: Part - add pricing fields
ALTER TABLE "Part" ADD COLUMN "unitPrice" DECIMAL(12,2);
ALTER TABLE "Part" ADD COLUMN "totalPrice" DECIMAL(12,2);

-- AlterTable: Operation - add cost fields
ALTER TABLE "Operation" ADD COLUMN "laborCost" DECIMAL(12,2);
ALTER TABLE "Operation" ADD COLUMN "materialCost" DECIMAL(12,2);

-- AlterTable: VehicleFile - add discount and tax rate
ALTER TABLE "VehicleFile" ADD COLUMN "discount" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "VehicleFile" ADD COLUMN "taxRate" DECIMAL(5,2) DEFAULT 20;
