-- DropForeignKey
ALTER TABLE "CustomerPhone" DROP CONSTRAINT "CustomerPhone_customerId_fkey";
ALTER TABLE "CustomerAddress" DROP CONSTRAINT "CustomerAddress_customerId_fkey";
ALTER TABLE "CustomerNote" DROP CONSTRAINT "CustomerNote_customerId_fkey";
ALTER TABLE "CustomerNote" DROP CONSTRAINT "CustomerNote_authorId_fkey";
ALTER TABLE "VehicleFile" DROP CONSTRAINT "VehicleFile_vehicleId_fkey";
ALTER TABLE "VehicleFile" DROP CONSTRAINT "VehicleFile_customerId_fkey";
ALTER TABLE "Part" DROP CONSTRAINT "Part_vehicleFileId_fkey";
ALTER TABLE "Part" DROP CONSTRAINT "Part_statusId_fkey";
ALTER TABLE "Operation" DROP CONSTRAINT "Operation_vehicleFileId_fkey";
ALTER TABLE "Operation" DROP CONSTRAINT "Operation_statusId_fkey";
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_vehicleFileId_fkey";
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_uploadedById_fkey";
ALTER TABLE "ReviewToken" DROP CONSTRAINT "ReviewToken_vehicleFileId_fkey";
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_vehicleFileId_fkey";
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_customerId_fkey";
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_assignedToId_fkey";
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- AddForeignKey (with onDelete behaviors)
ALTER TABLE "CustomerPhone" ADD CONSTRAINT "CustomerPhone_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VehicleFile" ADD CONSTRAINT "VehicleFile_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleFile" ADD CONSTRAINT "VehicleFile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Part" ADD CONSTRAINT "Part_vehicleFileId_fkey" FOREIGN KEY ("vehicleFileId") REFERENCES "VehicleFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Part" ADD CONSTRAINT "Part_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "PartStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_vehicleFileId_fkey" FOREIGN KEY ("vehicleFileId") REFERENCES "VehicleFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "OperationStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_vehicleFileId_fkey" FOREIGN KEY ("vehicleFileId") REFERENCES "VehicleFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewToken" ADD CONSTRAINT "ReviewToken_vehicleFileId_fkey" FOREIGN KEY ("vehicleFileId") REFERENCES "VehicleFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_vehicleFileId_fkey" FOREIGN KEY ("vehicleFileId") REFERENCES "VehicleFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
