import { z } from "zod";

// ============ User Schemas ============
export const createUserSchema = z.object({
  fullName: z.string().min(2, "Ad en az 2 karakter olmalı").max(100),
  email: z.string().email("Geçerli bir e-posta adresi girin").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli")
    .regex(/[a-z]/, "Şifre en az bir küçük harf içermeli")
    .regex(/[0-9]/, "Şifre en az bir rakam içermeli"),
  phone: z.string().max(20).optional().nullable(),
  roleKey: z.enum(["system_admin", "admin", "employee"]),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  roleKey: z.enum(["system_admin", "admin", "employee"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin").toLowerCase().trim(),
  password: z.string().min(1, "Şifre gereklidir"),
});

// ============ Customer Schemas ============
export const phoneSchema = z.object({
  label: z.string().max(50).optional().nullable(),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalı").max(20),
});

export const addressSchema = z.object({
  label: z.string().max(50).optional().nullable(),
  address: z.string().min(5, "Adres en az 5 karakter olmalı").max(500),
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(10).optional().nullable(),
});

export const createCustomerSchema = z.object({
  fullName: z.string().min(2, "Ad en az 2 karakter olmalı").max(100),
  email: z.string().email().toLowerCase().trim().optional().nullable(),
  tcVkn: z
    .string()
    .regex(/^[0-9]{10,11}$/, "TC/VKN 10 veya 11 haneli olmalı")
    .optional()
    .nullable(),
  note: z.string().max(1000).optional().nullable(),
  phones: z.array(phoneSchema).optional(),
  addresses: z.array(addressSchema).optional(),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().toLowerCase().trim().optional().nullable(),
  tcVkn: z
    .string()
    .regex(/^[0-9]{10,11}$/)
    .optional()
    .nullable(),
});

// ============ Vehicle Schemas ============
export const plateSchema = z
  .string()
  .min(5, "Plaka en az 5 karakter olmalı")
  .max(15)
  .toUpperCase()
  .trim();

export const createVehicleFileSchema = z.object({
  vehicleId: z.number().int().positive().optional().nullable(),
  plate: plateSchema,
  brandModel: z.string().min(2, "Marka/model en az 2 karakter olmalı").max(100),
  color: z.string().max(50).optional().nullable(),
  accidentDate: z.string().datetime().optional().nullable(),
  fileNumber: z.string().max(50).optional().nullable(),
  quickNote: z.string().max(500).optional().nullable(),
  customerId: z.number().int().positive("Müşteri seçilmeli"),
  expertId: z.number().int().positive().optional().nullable(),
});

export const updateVehicleFileSchema = z.object({
  brandModel: z.string().min(2).max(100).optional(),
  color: z.string().max(50).optional().nullable(),
  accidentDate: z.string().datetime().optional().nullable(),
  fileNumber: z.string().max(50).optional().nullable(),
  quickNote: z.string().max(500).optional().nullable(),
  status: z.enum(["open", "pending", "completed"]).optional(),
  expertId: z.number().int().positive().optional().nullable(),
});

// ============ Part Schemas ============
export const createPartSchema = z.object({
  vehicleFileId: z.number().int().positive(),
  name: z.string().min(2, "Parça adı en az 2 karakter olmalı").max(100),
  description: z.string().max(500).optional().nullable(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0).optional().nullable(),
  totalPrice: z.number().min(0).optional().nullable(),
  statusId: z.number().int().positive(),
});

export const updatePartSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().min(0).optional().nullable(),
  totalPrice: z.number().min(0).optional().nullable(),
  statusId: z.number().int().positive().optional(),
});

// ============ Operation Schemas ============
export const createOperationSchema = z.object({
  vehicleFileId: z.number().int().positive(),
  title: z.string().min(2, "İşlem başlığı en az 2 karakter olmalı").max(100),
  description: z.string().max(500).optional().nullable(),
  laborCost: z.number().min(0).optional().nullable(),
  materialCost: z.number().min(0).optional().nullable(),
  statusId: z.number().int().positive(),
});

export const updateOperationSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  laborCost: z.number().min(0).optional().nullable(),
  materialCost: z.number().min(0).optional().nullable(),
  statusId: z.number().int().positive().optional(),
});

// ============ Photo Schemas ============
export const createPhotoSchema = z.object({
  vehicleFileId: z.number().int().positive(),
  url: z.string().url("Geçerli bir URL girin"),
  title: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const updatePhotoSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

// ============ Expert Schemas ============
export const createExpertSchema = z.object({
  fullName: z.string().min(2, "Ad en az 2 karakter olmalı").max(100),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().toLowerCase().trim().optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const updateExpertSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().toLowerCase().trim().optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

// ============ Review Link Schemas ============
export const createReviewLinkSchema = z.object({
  fileId: z.number().int().positive("Dosya ID gereklidir"),
  expiresAt: z.string().datetime().optional().nullable(),
});

// ============ Status Schemas ============
export const createStatusSchema = z.object({
  label: z.string().min(2, "Durum adı en az 2 karakter olmalı").max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Geçerli bir renk kodu girin (örn: #ff0000)")
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateStatusSchema = z.object({
  label: z.string().min(2).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

// ============ Helper Functions ============
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError?.message || "Geçersiz veri",
    };
  }

  return { success: true, data: result.data };
}

// Tüm hataları döndüren versiyon
export function validateAll<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
