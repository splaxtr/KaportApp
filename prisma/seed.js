require("dotenv").config();

const { PrismaClient, RoleKey } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function seedRoles() {
  const roles = [
    { key: RoleKey.system_admin, name: "System Admin", description: "Tam yetkili, değiştirilemez", isSystem: true },
    { key: RoleKey.admin, name: "Admin", description: "Yönetici" },
    { key: RoleKey.employee, name: "Employee", description: "Personel" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      create: role,
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem ?? false,
      },
    });
  }
}

async function seedPermissions() {
  const permissions = [
    { key: "users.manage", description: "Kullanıcı yönetimi" },
    { key: "roles.manage", description: "Rol ve yetki yönetimi" },
    { key: "customers.manage", description: "Müşteri yönetimi" },
    { key: "vehicles.manage", description: "Araç yönetimi" },
    { key: "vehicleFiles.manage", description: "Araç dosyası yönetimi" },
    { key: "parts.manage", description: "Parça yönetimi" },
    { key: "operations.manage", description: "İşlem yönetimi" },
    { key: "photos.manage", description: "Fotoğraf yönetimi" },
    { key: "experts.manage", description: "Eksper yönetimi" },
    { key: "reviews.manage", description: "Sigorta inceleme linkleri" },
  ];

  const rolePermissions = {
    [RoleKey.system_admin]: permissions.map((p) => p.key),
    [RoleKey.admin]: permissions.map((p) => p.key).filter((key) => key !== "roles.manage"),
    [RoleKey.employee]: [
      "customers.manage",
      "vehicles.manage",
      "vehicleFiles.manage",
      "parts.manage",
      "operations.manage",
      "photos.manage",
      "experts.manage",
      "reviews.manage",
    ],
  };

  const permissionRecords = {};

  for (const permission of permissions) {
    const record = await prisma.permission.upsert({
      where: { key: permission.key },
      create: permission,
      update: { description: permission.description },
    });
    permissionRecords[record.key] = record.id;
  }

  for (const [roleKey, permKeys] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({ where: { key: roleKey } });
    if (!role) continue;

    for (const key of permKeys) {
      const permissionId = permissionRecords[key];
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        create: { roleId: role.id, permissionId },
        update: {},
      });
    }
  }
}

async function seedStatuses() {
  const partStatuses = [
    { label: "Beklemede", color: "#94a3b8", sortOrder: 1 },
    { label: "Sipariş Verildi", color: "#f59e0b", sortOrder: 2 },
    { label: "Teslim Alındı", color: "#22c55e", sortOrder: 3 },
    { label: "Montajlandı", color: "#0ea5e9", sortOrder: 4 },
    { label: "İptal", color: "#ef4444", sortOrder: 5 },
  ];

  const operationStatuses = [
    { label: "Planlandı", color: "#94a3b8", sortOrder: 1 },
    { label: "Devam Ediyor", color: "#f59e0b", sortOrder: 2 },
    { label: "Kontrol", color: "#0ea5e9", sortOrder: 3 },
    { label: "Tamamlandı", color: "#22c55e", sortOrder: 4 },
  ];

  for (const status of partStatuses) {
    await prisma.partStatus.upsert({
      where: { label: status.label },
      create: status,
      update: {
        color: status.color,
        sortOrder: status.sortOrder,
      },
    });
  }

  for (const status of operationStatuses) {
    await prisma.operationStatus.upsert({
      where: { label: status.label },
      create: status,
      update: {
        color: status.color,
        sortOrder: status.sortOrder,
      },
    });
  }
}

async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME || "System Admin";

  if (!email || !password) {
    console.info("ADMIN_EMAIL veya ADMIN_PASSWORD tanımlı değil, admin kullanıcı oluşturulmadı.");
    return;
  }

  const role = await prisma.role.findUnique({ where: { key: RoleKey.system_admin } });
  if (!role) {
    console.warn("System admin rolü bulunamadı, admin kullanıcı eklenemedi.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      fullName,
      roleId: role.id,
    },
    update: {
      fullName,
      passwordHash,
      roleId: role.id,
    },
  });
}

async function main() {
  await seedRoles();
  await seedPermissions();
  await seedStatuses();
  await seedAdminUser();
}

main()
  .then(() => {
    console.log("Seed tamamlandı.");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
