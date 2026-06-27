type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info";

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, module: string, msg: string): string {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] [${module}] ${msg}`;
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => {
      if (shouldLog("debug"))
        console.debug(formatMessage("debug", module, msg), meta ?? "");
    },
    info: (msg: string, meta?: Record<string, unknown>) => {
      if (shouldLog("info"))
        console.info(formatMessage("info", module, msg), meta ?? "");
    },
    warn: (msg: string, meta?: Record<string, unknown>) => {
      if (shouldLog("warn"))
        console.warn(formatMessage("warn", module, msg), meta ?? "");
    },
    error: (msg: string, meta?: Record<string, unknown>) => {
      if (shouldLog("error"))
        console.error(formatMessage("error", module, msg), meta ?? "");
    },
  };
}
