/**
 * Banking-Grade Enterprise Structured Logger
 *
 * - In Development: Clean, color-coded, human-readable terminal/console output.
 * - In Production: Machine-readable, structured JSON streaming to stdout/stderr.
 * - Sensitive Data: Automatic PII & credentials redaction (passwords, tokens, account numbers).
 */

import { redactSensitiveData } from "./redact";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

class BankingLogger {
  private minLevel: LogLevel =
    (process.env.LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === "production" ? "info" : "debug");

  setLevel(level: LogLevel) {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITIES[level] >= LOG_LEVEL_PRIORITIES[this.minLevel];
  }

  private formatMessage(entry: LogEntry): void {
    const isProd = process.env.NODE_ENV === "production";
    const isBrowser = typeof window !== "undefined";

    // Clean sensitive properties before logging
    const safeData = entry.data !== undefined ? redactSensitiveData(entry.data) : undefined;

    if (isProd && !isBrowser) {
      // Machine-readable JSON output for ELK / Datadog / CloudWatch / audit systems
      const jsonPayload = JSON.stringify({
        ...entry,
        data: safeData,
      });

      if (entry.level === "error") {
        process.stderr.write(`${jsonPayload}\n`);
      } else {
        process.stdout.write(`${jsonPayload}\n`);
      }
      return;
    }

    // Development & Browser formatted logging
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${
      entry.context ? ` [${entry.context}]` : ""
    }:`;

    switch (entry.level) {
      case "debug":
        console.debug(prefix, entry.message, safeData ?? "");
        break;
      case "info":
        console.info(prefix, entry.message, safeData ?? "");
        break;
      case "warn":
        console.warn(prefix, entry.message, safeData ?? "");
        break;
      case "error":
        console.error(prefix, entry.message, safeData ?? "");
        break;
    }
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown) {
    if (!this.shouldLog(level)) return;

    this.formatMessage({
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    });
  }

  debug(message: string, data?: unknown, context?: string) {
    this.log("debug", message, context, data);
  }

  info(message: string, data?: unknown, context?: string) {
    this.log("info", message, context, data);
  }

  warn(message: string, data?: unknown, context?: string) {
    this.log("warn", message, context, data);
  }

  error(message: string, data?: unknown, context?: string) {
    this.log("error", message, context, data);
  }

  /**
   * Create a scoped child logger with a preset context tag (e.g. logger.withContext("REDIS"))
   */
  withContext(context: string) {
    return {
      debug: (msg: string, data?: unknown) => this.debug(msg, data, context),
      info: (msg: string, data?: unknown) => this.info(msg, data, context),
      warn: (msg: string, data?: unknown) => this.warn(msg, data, context),
      error: (msg: string, data?: unknown) => this.error(msg, data, context),
    };
  }
}

export const logger = new BankingLogger();
export { maskAccountNumber, redactSensitiveData } from "./redact";
