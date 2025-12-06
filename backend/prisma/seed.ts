import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const ownerPassword = await bcrypt.hash('Owner123!', 10);
  const employeePassword = await bcrypt.hash('Employee123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { role: 'admin', password: adminPassword, name: 'Demo Admin' },
    create: {
      email: 'admin@demo.com',
      password: adminPassword,
      name: 'Demo Admin',
      role: 'admin',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: { role: 'owner', password: ownerPassword, name: 'Demo Owner' },
    create: {
      email: 'owner@demo.com',
      password: ownerPassword,
      name: 'Demo Owner',
      role: 'owner',
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@demo.com' },
    update: { role: 'employee', password: employeePassword, name: 'Demo Employee' },
    create: {
      email: 'employee@demo.com',
      password: employeePassword,
      name: 'Demo Employee',
      role: 'employee',
    },
  });

  const shop = await prisma.shop.upsert({
    where: { id: 'demo-shop-id' },
    update: { ownerId: owner.id, name: 'Demo Shop' },
    create: {
      id: 'demo-shop-id',
      name: 'Demo Shop',
      ownerId: owner.id,
    },
  });

  await prisma.user.update({
    where: { id: employee.id },
    data: { shopId: shop.id },
  });

  const customer = await prisma.customer.upsert({
    where: { id: 'demo-customer-id' },
    update: { name: 'Ahmet Erdem', phone: '+90 535 256 1337', email: 'ahmetsplaxtr@gmail.com' },
    create: {
      id: 'demo-customer-id',
      name: 'Ahmet Erdem',
      phone: '+90 535 256 1337',
      email: 'ahmetsplaxtr@gmail.com',
    },
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { id: 'demo-vehicle-id' },
    update: {
      plate: 'DEM123',
      brand: 'Toyota',
      model: 'Corolla',
      currentOwnerId: customer.id,
      createdBy: admin.id,
    },
    create: {
      id: 'demo-vehicle-id',
      plate: 'DEM123',
      brand: 'Toyota',
      model: 'Corolla',
      currentOwnerId: customer.id,
      createdBy: admin.id,
    },
  });

  await prisma.vehicleCase.upsert({
    where: { id: 'demo-case-id' },
    update: {},
    create: {
      id: 'demo-case-id',
      vehicleId: vehicle.id,
      ownerId: customer.id,
      caseNumber: 'CASE-001',
      status: 'new',
      notes: 'Demo case',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
