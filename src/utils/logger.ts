import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define file format (without colors for files)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: logFormat,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  }),
  
  // Error log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
  }),
  
  // Combined log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
  }),
  
  // HTTP requests log file
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  levels: logLevels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Enhanced logging methods with context
class Logger {
  // API Request logging
  logAPIRequest(method: string, url: string, ip: string, userAgent?: string, userId?: string) {
    const message = `${method} ${url} - IP: ${ip}${userId ? ` - User: ${userId}` : ''} - UA: ${userAgent?.substring(0, 100) || 'Unknown'}`;
    logger.http(`📥 REQUEST: ${message}`);
  }

  // API Response logging
  logAPIResponse(method: string, url: string, statusCode: number, responseTime: number, userId?: string) {
    const emoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    const message = `${method} ${url} - ${statusCode} - ${responseTime}ms${userId ? ` - User: ${userId}` : ''}`;
    
    if (statusCode >= 500) {
      logger.error(`${emoji} RESPONSE: ${message}`);
    } else if (statusCode >= 400) {
      logger.warn(`${emoji} RESPONSE: ${message}`);
    } else {
      logger.http(`${emoji} RESPONSE: ${message}`);
    }
  }

  // Authentication events
  logAuth(event: string, email: string, ip: string, success: boolean = true, error?: string) {
    const emoji = success ? '🔐' : '🚫';
    const level = success ? 'info' : 'warn';
    const message = `${emoji} AUTH ${event.toUpperCase()}: ${email} from ${ip}${error ? ` - Error: ${error}` : ''}`;
    logger[level](message);
  }

  // Database operations
  logDB(operation: string, collection: string, success: boolean = true, error?: string, userId?: string) {
    const emoji = success ? '💾' : '💥';
    const level = success ? 'debug' : 'error';
    const message = `${emoji} DB ${operation.toUpperCase()}: ${collection}${userId ? ` - User: ${userId}` : ''}${error ? ` - Error: ${error}` : ''}`;
    logger[level](message);
  }

  // Email operations
  logEmail(to: string, subject: string, success: boolean = true, error?: string) {
    const emoji = success ? '📧' : '📨';
    const level = success ? 'info' : 'error';
    const message = `${emoji} EMAIL: To ${to} - Subject: ${subject}${error ? ` - Error: ${error}` : ''}`;
    logger[level](message);
  }

  // OTP operations
  logOTP(action: string, email: string, success: boolean = true, error?: string) {
    const emoji = success ? '🔑' : '🔒';
    const level = success ? 'info' : 'warn';
    const message = `${emoji} OTP ${action.toUpperCase()}: ${email}${error ? ` - Error: ${error}` : ''}`;
    logger[level](message);
  }

  // Security events
  logSecurity(event: string, ip: string, details?: string) {
    const message = `🛡️ SECURITY ${event.toUpperCase()}: IP ${ip}${details ? ` - ${details}` : ''}`;
    logger.warn(message);
  }

  // Business logic events
  logBusiness(event: string, userId: string, details?: string) {
    const message = `💼 BUSINESS ${event.toUpperCase()}: User ${userId}${details ? ` - ${details}` : ''}`;
    logger.info(message);
  }

  // General logging methods
  info(message: string, meta?: any) {
    logger.info(message, meta);
  }

  warn(message: string, meta?: any) {
    logger.warn(message, meta);
  }

  error(message: string, meta?: any) {
    logger.error(message, meta);
  }

  debug(message: string, meta?: any) {
    logger.debug(message, meta);
  }

  http(message: string, meta?: any) {
    logger.http(message, meta);
  }
}

export default new Logger();