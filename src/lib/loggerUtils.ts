/**
 * Logging utility with support for different log levels
 */
import { supabase } from './supabase';

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
  persistToDb?: boolean;
  persistTable?: string;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: import.meta.env.MODE === 'production' ? LogLevel.ERROR : LogLevel.DEBUG,
  includeTimestamp: true,
  prefix: '',
  persistToDb: false,
  persistTable: 'application_logs'
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
 * Get session ID from localStorage or create a new one
 */
function getSessionId(): string {
  try {
    let sessionId = localStorage.getItem('lodge_tix_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('lodge_tix_session_id', sessionId);
    }
    return sessionId;
  } catch (e) {
    return `session_${Date.now()}`;
  }
}

/**
 * Get current user ID if available
 */
function getUserId(): string | undefined {
  try {
    const { data } = supabase.auth.getSession();
    return data?.session?.user?.id;
  } catch (e) {
    return undefined;
  }
}

/**
 * Format log message with optional timestamp and prefix
 */
function formatLogMessage(message: string, context?: Record<string, any>): string {
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
 * Persist log to Supabase if enabled
 */
async function persistLogToDb(
  level: LogLevel, 
  message: string, 
  context?: Record<string, any>
): Promise<void> {
  if (!currentConfig.persistToDb || !currentConfig.persistTable) {
    return;
  }
  
  try {
    await supabase
      .from(currentConfig.persistTable)
      .insert([{
        level: LogLevel[level],
        message,
        context: context || null,
        user_id: getUserId(),
        session_id: getSessionId(),
        timestamp: new Date().toISOString()
      }]);
  } catch (error) {
    // Fallback to console only
    console.error('Failed to persist log:', error);
  }
}

/**
 * Log error messages
 */
export function error(message: string, ...args: unknown[]): void {
  if (currentConfig.level >= LogLevel.ERROR) {
    // Extract context if it's the last argument and is an object
    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const context = lastArg && typeof lastArg === 'object' ? lastArg : undefined;
    
    console.error(formatLogMessage(message), ...args);
    
    if (currentConfig.persistToDb) {
      persistLogToDb(LogLevel.ERROR, message, context as Record<string, any>);
    }
  }
}

/**
 * Log warning messages
 */
export function warn(message: string, ...args: unknown[]): void {
  if (currentConfig.level >= LogLevel.WARN) {
    // Extract context if it's the last argument and is an object
    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const context = lastArg && typeof lastArg === 'object' ? lastArg : undefined;
    
    console.warn(formatLogMessage(message), ...args);
    
    if (currentConfig.persistToDb) {
      persistLogToDb(LogLevel.WARN, message, context as Record<string, any>);
    }
  }
}

/**
 * Log info messages
 */
export function info(message: string, ...args: unknown[]): void {
  if (currentConfig.level >= LogLevel.INFO) {
    // Extract context if it's the last argument and is an object
    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const context = lastArg && typeof lastArg === 'object' ? lastArg : undefined;
    
    console.info(formatLogMessage(message), ...args);
    
    if (currentConfig.persistToDb) {
      persistLogToDb(LogLevel.INFO, message, context as Record<string, any>);
    }
  }
}

/**
 * Log debug messages
 */
export function debug(message: string, ...args: unknown[]): void {
  if (currentConfig.level >= LogLevel.DEBUG) {
    // Extract context if it's the last argument and is an object
    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const context = lastArg && typeof lastArg === 'object' ? lastArg : undefined;
    
    console.debug(formatLogMessage(message), ...args);
    
    if (currentConfig.persistToDb) {
      persistLogToDb(LogLevel.DEBUG, message, context as Record<string, any>);
    }
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