import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Upload dizini
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";
const PUBLIC_URL_PREFIX = process.env.UPLOAD_URL_PREFIX || "/api/uploads";

// Desteklenen dosya türleri
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Magic byte signatures for image file types
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  "image/gif": [[0x47, 0x49, 0x46, 0x38]], // GIF8
};

/** Dosyanın gerçek türünü magic byte'lardan doğrula */
function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const signatures = MAGIC_BYTES[declaredMime];
  if (!signatures) return false;

  return signatures.some((sig) => {
    if (buffer.length < sig.length) return false;
    return sig.every((byte, i) => buffer[i] === byte);
  });
}

/** Dosya yolunun upload dizini içinde kaldığını doğrula */
function isPathSafe(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const resolvedBase = path.resolve(UPLOAD_DIR);
  return resolved.startsWith(resolvedBase + path.sep) || resolved === resolvedBase;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  success: true;
  fileName: string;
  url: string;
  size: number;
}

export interface UploadError {
  success: false;
  error: string;
}

// Dosya adı oluştur
function generateFileName(mimeType: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = mimeType.split("/")[1] || "jpg";
  return `${timestamp}-${random}.${ext}`;
}

// Klasör oluştur
async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// Dosya yükle
export async function uploadFile(
  file: File | Blob,
  vehicleFileId: number
): Promise<UploadResult | UploadError> {
  // Dosya türü kontrol
  const mimeType = file.type;
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      success: false,
      error: `Desteklenmeyen dosya türü. İzin verilenler: JPEG, PNG, WebP, GIF`,
    };
  }

  // Dosya boyutu kontrol
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `Dosya çok büyük. Maksimum boyut: 10MB`,
    };
  }

  try {
    // Klasör yolu: /uploads/photos/{vehicleFileId}/
    const subDir = path.join(UPLOAD_DIR, "photos", String(vehicleFileId));
    await ensureDir(subDir);

    // Dosya adı
    const fileName = generateFileName(mimeType);
    const filePath = path.join(subDir, fileName);

    // Dosyayı oku ve magic byte doğrula
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, mimeType)) {
      return {
        success: false,
        error: "Dosya içeriği belirtilen tür ile uyuşmuyor.",
      };
    }

    // Path traversal koruması
    if (!isPathSafe(filePath)) {
      return { success: false, error: "Geçersiz dosya yolu." };
    }

    await writeFile(filePath, buffer);

    // Public URL
    const url = `${PUBLIC_URL_PREFIX}/photos/${vehicleFileId}/${fileName}`;

    return {
      success: true,
      fileName,
      url,
      size: file.size,
    };
  } catch (error) {
    console.error("File upload error:", error);
    return { success: false, error: "Dosya yüklenirken hata oluştu" };
  }
}

// Base64'ten dosya yükle
export async function uploadBase64(
  base64Data: string,
  vehicleFileId: number,
  mimeType: string
): Promise<UploadResult | UploadError> {
  // Dosya türü kontrol
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      success: false,
      error: `Desteklenmeyen dosya türü. İzin verilenler: JPEG, PNG, WebP, GIF`,
    };
  }

  try {
    // Base64'ü çöz
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    // Boyut kontrol
    if (buffer.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `Dosya çok büyük. Maksimum boyut: 10MB`,
      };
    }

    // Magic byte doğrulama
    if (!validateMagicBytes(buffer, mimeType)) {
      return {
        success: false,
        error: "Dosya içeriği belirtilen tür ile uyuşmuyor.",
      };
    }

    // Klasör yolu
    const subDir = path.join(UPLOAD_DIR, "photos", String(vehicleFileId));
    await ensureDir(subDir);

    // Dosya adı
    const fileName = generateFileName(mimeType);
    const filePath = path.join(subDir, fileName);

    // Path traversal koruması
    if (!isPathSafe(filePath)) {
      return { success: false, error: "Geçersiz dosya yolu." };
    }

    await writeFile(filePath, buffer);

    // Public URL
    const url = `${PUBLIC_URL_PREFIX}/photos/${vehicleFileId}/${fileName}`;

    return {
      success: true,
      fileName,
      url,
      size: buffer.length,
    };
  } catch (error) {
    console.error("Base64 upload error:", error);
    return { success: false, error: "Dosya yüklenirken hata oluştu" };
  }
}

// Dosya sil
export async function deleteFile(url: string): Promise<boolean> {
  try {
    if (!url.startsWith(PUBLIC_URL_PREFIX)) {
      return false;
    }
    // URL'den dosya yolunu çıkar
    const relativePath = url.replace(PUBLIC_URL_PREFIX, "");
    const filePath = path.join(UPLOAD_DIR, relativePath);

    // Path traversal koruması
    if (!isPathSafe(filePath)) {
      return false;
    }

    if (existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("File delete error:", error);
    return false;
  }
}

// Dosya var mı kontrol
export function fileExists(url: string): boolean {
  try {
    const relativePath = url.replace(PUBLIC_URL_PREFIX, "");
    const filePath = path.join(UPLOAD_DIR, relativePath);

    // Path traversal koruması
    if (!isPathSafe(filePath)) {
      return false;
    }

    return existsSync(filePath);
  } catch {
    return false;
  }
}
