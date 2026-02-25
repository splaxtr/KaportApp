-- CreateEnum: AppointmentType
CREATE TYPE "AppointmentType" AS ENUM ('intake', 'delivery', 'inspection', 'expert', 'other');

-- CreateEnum: AppointmentStatus
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed');

-- CreateTable: Appointment
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "type" "AppointmentType" NOT NULL DEFAULT 'other',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "vehicleFileId" INTEGER,
    "customerId" INTEGER,
    "assignedToId" INTEGER,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");
CREATE INDEX "Appointment_vehicleFileId_idx" ON "Appointment"("vehicleFileId");
CREATE INDEX "Appointment_customerId_idx" ON "Appointment"("customerId");
CREATE INDEX "Appointment_assignedToId_idx" ON "Appointment"("assignedToId");
CREATE INDEX "Appointment_deletedAt_idx" ON "Appointment"("deletedAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_vehicleFileId_fkey" FOREIGN KEY ("vehicleFileId") REFERENCES "VehicleFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
