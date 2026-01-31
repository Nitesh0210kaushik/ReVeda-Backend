import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Extend Request interface to include startTime
interface LoggingRequest extends Request {
  startTime?: number;
  userId?: string;
}

// Request logging middleware
export const requestLogger = (req: LoggingRequest, res: Response, next: NextFunction) => {
  // Record start time
  req.startTime = Date.now();
  
  // Extract user ID from token if available
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // We'll set this in the auth middleware
      req.userId = req.userId || 'anonymous';
    } catch (error) {
      req.userId = 'anonymous';
    }
  } else {
    req.userId = 'anonymous';
  }

  // Log the incoming request
  logger.logAPIRequest(
    req.method,
    req.originalUrl,
    req.ip || req.connection.remoteAddress || 'unknown',
    req.get('User-Agent'),
    req.userId
  );

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    // Log the response
    logger.logAPIResponse(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      req.userId
    );

    // Log response body for errors (but not sensitive data)
    if (res.statusCode >= 400) {
      const sanitizedBody = sanitizeResponseBody(body);
      logger.debug(`Response Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return originalJson.call(this, body);
  };

  next();
};

// Sanitize response body to remove sensitive information
function sanitizeResponseBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'otp'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
    if (sanitized.data && sanitized.data[field]) {
      sanitized.data[field] = '[REDACTED]';
    }
    if (sanitized.data && sanitized.data.tokens) {
      sanitized.data.tokens = '[REDACTED]';
    }
  });

  return sanitized;
}

// Error logging middleware
export const errorLogger = (error: any, req: LoggingRequest, res: Response, next: NextFunction) => {
  // Log the error
  logger.error(`💥 ERROR: ${req.method} ${req.originalUrl} - ${error.message}`, {
    stack: error.stack,
    userId: req.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next(error);
};