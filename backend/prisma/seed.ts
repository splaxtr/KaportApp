import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.partStatus.createMany({
    data: [
      { key: 'pending', label: 'Bekliyor', color: '#9ca3af', order: 1 },
      { key: 'ordered', label: 'Sipariş Verildi', color: '#60a5fa', order: 2 },
      { key: 'shipping', label: 'Yolda', color: '#c084fc', order: 3 },
      { key: 'arrived', label: 'Geldi', color: '#34d399', order: 4 },
      { key: 'installed', label: 'Takıldı', color: '#10b981', order: 5 },
      { key: 'repair_pending', label: 'Tamir Edilecek', color: '#f59e0b', order: 6 },
      { key: 'repair_sent', label: 'Tamire Gönderildi', color: '#f97316', order: 7 },
      { key: 'repaired', label: 'Tamir Edildi', color: '#22c55e', order: 8 },
    ],
    skipDuplicates: true,
  });

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

  const vehicle = await prisma.vehicle.upsert({
    where: { id: 'demo-vehicle-id' },
    update: {
      plate: 'DEM123',
      brand: 'Toyota',
      model: 'Corolla',
      customerName: 'Demo Customer',
      phone: '5550000000',
      shopId: shop.id,
      createdBy: admin.id,
    },
    create: {
      id: 'demo-vehicle-id',
      plate: 'DEM123',
      brand: 'Toyota',
      model: 'Corolla',
      customerName: 'Demo Customer',
      phone: '5550000000',
      shopId: shop.id,
      createdBy: admin.id,
    },
  });

  await prisma.part.createMany({
    data: [
      {
        id: 'demo-part-1',
        shopId: shop.id,
        vehicleId: vehicle.id,
        name: 'Kaput',
        statusKey: 'pending',
        quantity: 1,
      },
      {
        id: 'demo-part-2',
        shopId: shop.id,
        vehicleId: vehicle.id,
        name: 'Sağ Çamurluk',
        statusKey: 'ordered',
        quantity: 1,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.photo.createMany({
    data: [
      {
        id: 'demo-photo-1',
        shopId: shop.id,
        vehicleId: vehicle.id,
        url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d',
        storagePath: 'demo/remote-photo-1',
        addedBy: admin.id,
      },
      {
        id: 'demo-photo-2',
        shopId: shop.id,
        vehicleId: vehicle.id,
        url: 'https://images.unsplash.com/photo-1502877828070-33b167ad6860',
        storagePath: 'demo/remote-photo-2',
        addedBy: admin.id,
      },
    ],
    skipDuplicates: true,
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
