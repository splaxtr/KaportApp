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
async function ensureLogDir(): Promise<void> {
  if (!existsSync(LOG_DIR)) {
    await mkdir(LOG_DIR, { recursive: true });
  }
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
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return JSON.stringify(logEntry) + "\n";
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

  try {
    await ensureLogDir();
    const logLine = formatLog(level, message, context, error);

    // Ana log dosyasına yaz
    await appendFile(getLogFileName(), logLine);

    // Error seviyesinde ayrı dosyaya da yaz
    if (level === "error") {
      await appendFile(getErrorLogFileName(), logLine);
    }

    // Console'a da yaz (development için)
    if (process.env.NODE_ENV !== "production") {
      const consoleMethod = level === "error" ? console.error : console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, context || "");
    }
  } catch (e) {
    // Log yazılamadıysa console'a yaz
    console.error("Logger error:", e);
    console.error("Original log:", { level, message, context, error });
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
