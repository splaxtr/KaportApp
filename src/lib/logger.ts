import { appendFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const LOG_DIR = process.env.LOG_DIR || "/app/logs";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface LogContext {
  userId?: number;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

// Klasör oluştur
let logDirChecked = false;
async function ensureLogDir(): Promise<void> {
  if (logDirChecked) return;
  if (!existsSync(LOG_DIR)) {
    await mkdir(LOG_DIR, { recursive: true });
  }
  logDirChecked = true;
}

// Log dosya adı (günlük)
function getLogFileName(): string {
  const date = new Date().toISOString().split("T")[0];
  return path.join(LOG_DIR, `app-${date}.log`);
}

// Error log dosya adı
function getErrorLogFileName(): string {
  const date = new Date().toISOString().split("T")[0];
  return path.join(LOG_DIR, `error-${date}.log`);
}

// Hata türünü belirle
function classifyError(error: Error): string {
  const msg = error.message || "";
  const name = error.name || "";

  if (name.includes("PrismaClient") || msg.includes("prisma")) {
    if (msg.includes("Authentication failed")) return "DB_AUTH_FAILED";
    if (msg.includes("connect") || msg.includes("Connection")) return "DB_CONNECTION_ERROR";
    if (msg.includes("timeout") || msg.includes("Timed out")) return "DB_TIMEOUT";
    return "DB_ERROR";
  }
  if (msg.includes("Redis") || msg.includes("redis") || msg.includes("ECONNREFUSED")) {
    return "REDIS_ERROR";
  }
  if (msg.includes("JWT") || msg.includes("jwt") || msg.includes("token")) {
    return "JWT_ERROR";
  }
  if (msg.includes("ENOENT") || msg.includes("EACCES") || msg.includes("Permission denied")) {
    return "FILESYSTEM_ERROR";
  }
  if (msg.includes("fetch") || msg.includes("ETIMEDOUT") || msg.includes("ENOTFOUND")) {
    return "NETWORK_ERROR";
  }
  return "UNKNOWN_ERROR";
}

// Log formatla
function formatLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): string {
  const timestamp = new Date().toISOString();
  const logEntry: Record<string, unknown> = {
    timestamp,
    level: level.toUpperCase(),
    message,
  };

  if (context) {
    logEntry.context = context;
  }

  if (error) {
    logEntry.error = {
      type: classifyError(error),
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return JSON.stringify(logEntry) + "\n";
}

// Console log formatla (okunabilir)
function formatConsole(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): string {
  const time = new Date().toISOString().slice(11, 23);
  let line = `[${time}] [${level.toUpperCase()}] ${message}`;

  if (context) {
    const parts: string[] = [];
    if (context.ip) parts.push(`ip=${context.ip}`);
    if (context.email) parts.push(`email=${context.email}`);
    if (context.path) parts.push(`path=${context.path}`);
    if (context.userId) parts.push(`uid=${context.userId}`);
    if (context.method) parts.push(`method=${context.method}`);
    // Kalan context key'leri
    for (const [k, v] of Object.entries(context)) {
      if (!["ip", "email", "path", "userId", "method", "userAgent", "action", "statusCode", "duration"].includes(k)) {
        parts.push(`${k}=${v}`);
      }
    }
    if (parts.length > 0) line += ` | ${parts.join(" ")}`;
  }

  if (error) {
    line += ` | [${classifyError(error)}] ${error.name}: ${error.message}`;
  }

  return line;
}

// Seviye kontrolü
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL as LogLevel];
}

// Log yaz
async function writeLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): Promise<void> {
  if (!shouldLog(level)) return;

  // Her zaman console'a yaz — docker logs ile görülebilir
  const consoleMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleMethod(formatConsole(level, message, context, error));

  // Dosyaya yaz
  try {
    await ensureLogDir();
    const logLine = formatLog(level, message, context, error);

    await appendFile(getLogFileName(), logLine);

    if (level === "error") {
      await appendFile(getErrorLogFileName(), logLine);
    }
  } catch (e) {
    // Dosya yazılamadıysa sadece console'a bilgi ver (zaten üstte console'a yazdık)
    console.error("[LOGGER] Dosyaya yazılamadı:", (e as Error).message);
  }
}

// Export edilecek fonksiyonlar
export const logger = {
  debug: (message: string, context?: LogContext) =>
    writeLog("debug", message, context),

  info: (message: string, context?: LogContext) =>
    writeLog("info", message, context),

  warn: (message: string, context?: LogContext) =>
    writeLog("warn", message, context),

  error: (message: string, error?: Error, context?: LogContext) =>
    writeLog("error", message, context, error),

  // API request logger
  request: (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ) =>
    writeLog("info", `${method} ${path} ${statusCode} ${duration}ms`, {
      ...context,
      method,
      path,
      statusCode,
      duration,
    }),

  // Auth logger
  auth: (
    action: "login" | "logout" | "failed",
    email: string,
    context?: LogContext
  ) =>
    writeLog(action === "failed" ? "warn" : "info", `Auth ${action}: ${email}`, {
      ...context,
      action,
      email,
    }),

  // Audit logger
  audit: (action: string, entity: string, context?: LogContext) =>
    writeLog("info", `AUDIT ${action}: ${entity}`, {
      ...context,
      action,
      entity,
    }),
};

export default logger;
