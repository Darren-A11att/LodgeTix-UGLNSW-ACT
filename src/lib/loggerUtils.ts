/**
 * Logging utility with support for different log levels
 */

// Log levels in order of severity (highest to lowest)
export enum LogLevel {
  NONE = 0, // No logging
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Configuration interface
export interface LoggerConfig {
  level: LogLevel;
  includeTimestamp?: boolean;
  prefix?: string;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG,
  includeTimestamp: true,
  prefix: ''
};

// Current configuration
let currentConfig: LoggerConfig = { ...defaultConfig };

/**
 * Configure the logger
 * @param config Logger configuration
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Reset logger to default configuration
 */
export function resetLogger(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Get current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...currentConfig };
}

/**
 * Format log message with optional timestamp and prefix
 */
function formatLogMessage(message: string): string {
  const parts: string[] = [];
  
  if (currentConfig.includeTimestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  if (currentConfig.prefix) {
    parts.push(`[${currentConfig.prefix}]`);
  }
  
  parts.push(message);
  return parts.join(' ');
}

/**
 * Log error messages
 */
export function error(message: string, ...args: unknown[]): void {
  if (currentConfig.level >= LogLevel.ERROR) {
    console.error(formatLogMessage(message), ...args);
  }
}

/**
 * Log warning messages
 */
export function warn(message: string, ...args: unknown[]): void {
  if (currentConfig.level >= LogLevel.WARN) {
    console.warn(formatLogMessage(message), ...args);
  }
}

/**
 * Log info messages
 */
export function info(message: string, ...args: unknown[]): void {
  if (currentConfig.level >= LogLevel.INFO) {
    console.info(formatLogMessage(message), ...args);
  }
}

/**
 * Log debug messages
 */
export function debug(message: string, ...args: unknown[]): void {
  if (currentConfig.level >= LogLevel.DEBUG) {
    console.debug(formatLogMessage(message), ...args);
  }
}

// Export a default logger object with all methods
const logger = {
  error,
  warn,
  info,
  debug,
  configure: configureLogger,
  reset: resetLogger,
  getConfig: getLoggerConfig,
  LogLevel
};

export default logger;