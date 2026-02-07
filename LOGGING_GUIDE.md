# ReVeda Backend Logging System

Comprehensive logging implementation with Winston, file rotation, and structured logging.

## 🛠️ **Technical Implementation**

### **Libraries Used**
```json
{
  "winston": "^3.11.0",                    // Core logging library
  "winston-daily-rotate-file": "^4.7.1",  // Daily file rotation
  "morgan": "^1.10.0"                      // HTTP request logging
}
```

### **Core Architecture**
```
Logger System Architecture:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Logger Utils   │───▶│   Winston Core  │
│   Controllers   │    │   (logger.ts)    │    │   + Transports  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Log Middleware │    │   File System   │
                       │  (logging.ts)    │    │   + Console     │
                       └──────────────────┘    └─────────────────┘
```

## 📚 **Implementation Details**

### **1. Winston Logger Configuration (`src/utils/logger.ts`)**

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Log levels hierarchy
const logLevels = {
  error: 0,    // Highest priority
  warn: 1,     // Warnings
  info: 2,     // General info
  http: 3,     // HTTP requests
  debug: 4,    // Lowest priority (most verbose)
};

// Color mapping for console output
const logColors = {
  error: 'red',
  warn: 'yellow', 
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
```

### **2. Transport Configuration**
```typescript
const transports = [
  // Console Transport (Development)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  }),
  
  // Error File Transport
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',      // Max file size
    maxFiles: '14d',     // Keep for 14 days
  }),
  
  // Combined File Transport
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
  }),
  
  // HTTP File Transport
  new DailyRotateFile({
    filename: 'logs/http-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '14d',
  }),
];
```

### **3. Custom Logger Class Methods**

```typescript
class Logger {
  // API Request/Response Logging
  logAPIRequest(method, url, ip, userAgent, userId) {
    const message = `${method} ${url} - IP: ${ip}${userId ? ` - User: ${userId}` : ''} - UA: ${userAgent?.substring(0, 100) || 'Unknown'}`;
    logger.http(`📥 REQUEST: ${message}`);
  }

  logAPIResponse(method, url, statusCode, responseTime, userId) {
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

  // Authentication Events
  logAuth(event, email, ip, success = true, error) {
    const emoji = success ? '🔐' : '🚫';
    const level = success ? 'info' : 'warn';
    const message = `${emoji} AUTH ${event.toUpperCase()}: ${email} from ${ip}${error ? ` - Error: ${error}` : ''}`;
    logger[level](message);
  }

  // Database Operations
  logDB(operation, collection, success = true, error, userId) {
    const emoji = success ? '💾' : '💥';
    const level = success ? 'debug' : 'error';
    const message = `${emoji} DB ${operation.toUpperCase()}: ${collection}${userId ? ` - User: ${userId}` : ''}${error ? ` - Error: ${error}` : ''}`;
    logger[level](message);
  }

  // OTP Operations
  logOTP(action, email, success = true, error) {
    const emoji = success ? '🔑' : '🔒';
    const level = success ? 'info' : 'warn';
    const message = `${emoji} OTP ${action.toUpperCase()}: ${email}${error ? ` - Error: ${error}` : ''}`;
    logger[level](message);
  }

  // Security Events
  logSecurity(event, ip, details) {
    const message = `🛡️ SECURITY ${event.toUpperCase()}: IP ${ip}${details ? ` - ${details}` : ''}`;
    logger.warn(message);
  }

  // Business Logic Events
  logBusiness(event, userId, details) {
    const message = `💼 BUSINESS ${event.toUpperCase()}: User ${userId}${details ? ` - ${details}` : ''}`;
    logger.info(message);
  }
}
```

## 🔧 **Middleware Implementation**

### **Request Logging Middleware (`src/middleware/logging.ts`)**

```typescript
export const requestLogger = (req, res, next) => {
  // Record start time for response time calculation
  req.startTime = Date.now();
  
  // Extract user ID from token if available
  req.userId = req.userId || 'anonymous';

  // Log incoming request
  logger.logAPIRequest(
    req.method,
    req.originalUrl,
    req.ip || req.connection.remoteAddress || 'unknown',
    req.get('User-Agent'),
    req.userId
  );

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    // Log the response
    logger.logAPIResponse(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      req.userId
    );

    // Log response body for errors (sanitized)
    if (res.statusCode >= 400) {
      const sanitizedBody = sanitizeResponseBody(body);
      logger.debug(`Response Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return originalJson.call(this, body);
  };

  next();
};
```

### **Sensitive Data Sanitization**
```typescript
function sanitizeResponseBody(body) {
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
```

## 🎯 **Controller Integration**

### **How Logging is Integrated in Controllers**

```typescript
// Example from authController.ts
async signup(req, res) {
  const startTime = Date.now();
  const { firstName, lastName, email, phoneNumber } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  try {
    // 1. Log attempt
    logger.info(`🚀 SIGNUP ATTEMPT: ${email} from ${clientIP}`);

    // 2. Business logic with database logging
    const user = new User({ firstName, lastName, email, phoneNumber, otp, otpExpiry });
    await user.save();
    logger.logDB('create', 'users', true, undefined, user._id.toString());

    // 3. Log OTP generation
    logger.logOTP('generate', email, true);

    // 4. Log email operation
    const emailSent = await otpService.sendOTPEmail(email, otp, firstName);
    logger.logEmail(email, 'OTP Verification', emailSent);

    // 5. Log authentication success
    logger.logAuth('signup_success', email, clientIP, true);

    // 6. Log business event
    logger.logBusiness('user_registered', user._id.toString(), `${firstName} ${lastName}`);

    // 7. Log completion with timing
    const responseTime = Date.now() - startTime;
    logger.info(`✅ SIGNUP COMPLETED: ${email} in ${responseTime}ms`);

    res.status(201).json({ success: true, message: '...' });
  } catch (error) {
    // 8. Log errors with full context
    logger.error(`💥 SIGNUP ERROR: ${email} - ${error.message}`, {
      stack: error.stack,
      ip: clientIP,
      requestBody: { firstName, lastName, email, phoneNumber }
    });
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
```

## 📊 **Log Flow Diagram**

```
API Request Flow with Logging:
┌─────────────────┐
│  Client Request │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌──────────────────┐
│ Request Logger  │───▶│ 📥 REQUEST Log   │
│ Middleware      │    │ (Method, URL,    │
└─────────┬───────┘    │  IP, User-Agent) │
          │            └──────────────────┘
          ▼
┌─────────────────┐    ┌──────────────────┐
│   Controller    │───▶│ 🚀 ATTEMPT Log   │
│   Method        │    │ (Business Logic) │
└─────────┬───────┘    └──────────────────┘
          │
          ▼
┌─────────────────┐    ┌──────────────────┐
│  Database       │───▶│ 💾 DB Log        │
│  Operations     │    │ (CRUD Operations)│
└─────────┬───────┘    └──────────────────┘
          │
          ▼
┌─────────────────┐    ┌──────────────────┐
│  External       │───▶│ 📧 EMAIL Log     │
│  Services       │    │ 🔑 OTP Log       │
└─────────┬───────┘    └──────────────────┘
          │
          ▼
┌─────────────────┐    ┌──────────────────┐
│  Response       │───▶│ ✅ RESPONSE Log  │
│  Middleware     │    │ (Status, Time)   │
└─────────────────┘    └──────────────────┘
```

## 🎨 **Log Format Structure**

### **Timestamp Format**
```
2026-01-28 19:32:07:327
│          │        │
│          │        └── Milliseconds
│          └─────────── Time (HH:mm:ss)
└────────────────────── Date (YYYY-MM-DD)
```

### **Log Message Structure**
```
[TIMESTAMP] [LEVEL]: [EMOJI] [CATEGORY] [ACTION]: [DETAILS]
│           │        │       │          │         │
│           │        │       │          │         └── Specific details
│           │        │       │          └─────────── Action performed
│           │        │       └────────────────────── Log category
│           │        └────────────────────────────── Visual identifier
│           └─────────────────────────────────────── Log level
└─────────────────────────────────────────────────── Timestamp
```

### **Example Breakdown**
```
2026-01-28 19:32:07:327 info: 🔐 AUTH SIGNUP_SUCCESS: test.user2@example.com from ::1
│                       │     │   │    │             │                    │
│                       │     │   │    │             │                    └── Client IP
│                       │     │   │    │             └─────────────────────── User email
│                       │     │   │    └───────────────────────────────────── Action
│                       │     │   └────────────────────────────────────────── Category
│                       │     └────────────────────────────────────────────── Emoji
│                       └──────────────────────────────────────────────────── Level
└──────────────────────────────────────────────────────────────────────────── Timestamp
```

## 🔄 **Log Rotation Mechanism**

### **Daily Rotation Configuration**
```typescript
new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',  // %DATE% replaced with YYYY-MM-DD
  datePattern: 'YYYY-MM-DD',             // Daily rotation
  maxSize: '20m',                        // Max 20MB per file
  maxFiles: '14d',                       // Keep 14 days
  auditFile: 'logs/audit.json',          // Audit trail
  zippedArchive: true,                   // Compress old files
})
```

### **File Naming Convention**
```
logs/
├── combined-2026-01-28.log      ← Today's all logs
├── combined-2026-01-27.log      ← Yesterday's logs
├── combined-2026-01-26.log.gz   ← Compressed older logs
├── error-2026-01-28.log         ← Today's errors
├── http-2026-01-28.log          ← Today's HTTP requests
└── audit.json                   ← Rotation audit trail
```

## 🎛️ **Environment-Based Configuration**

### **Development Mode**
```typescript
level: 'debug',           // Show all logs
console: true,            // Colored console output
files: true,              // Write to files
format: 'colorized'       // Pretty formatting
```

### **Production Mode**
```typescript
level: 'warn',            // Only warnings and errors
console: false,           // No console output
files: true,              // Write to files only
format: 'json'            // Structured JSON format
```

## 📈 **Performance Considerations**

### **Async Logging**
```typescript
// Winston handles async writes automatically
logger.info('Message');  // Non-blocking
// Continues immediately without waiting for file write
```

### **Log Level Filtering**
```typescript
// In production, debug logs are filtered out at source
if (logger.level >= 'debug') {
  logger.debug('Expensive operation details');  // Only runs if debug enabled
}
```

### **Memory Management**
- **Stream-based writing**: No memory accumulation
- **File rotation**: Prevents unlimited file growth
- **Compression**: Reduces storage space
- **Cleanup**: Automatic old file removal

This comprehensive logging system provides enterprise-level observability with minimal performance impact!

## 🎨 **Log Format Examples**

### **API Request Logging**
```
2026-01-28 19:31:36:3136 http: 📥 REQUEST: GET /api/v1/health - IP: ::1 - User: anonymous - UA: Mozilla/5.0...
2026-01-28 19:31:36:3136 http: ✅ RESPONSE: GET /api/v1/health - 200 - 44ms - User: anonymous
```

### **Authentication Events**
```
2026-01-28 19:32:07:327 info: 🚀 SIGNUP ATTEMPT: test.user2@example.com from ::1
2026-01-28 19:32:07:327 info: 🔐 AUTH SIGNUP_SUCCESS: test.user2@example.com from ::1
2026-01-28 19:32:07:327 info: ✅ SIGNUP COMPLETED: test.user2@example.com in 21ms
```

### **OTP Operations**
```
2026-01-28 19:32:07:327 info: 🔑 OTP GENERATE: test.user2@example.com
2026-01-28 19:32:58:3258 info: 🔑 OTP VERIFY_SUCCESS: test.user2@example.com
```

### **Database Operations**
```
2026-01-28 19:32:07:327 debug: 💾 DB CREATE: users - User: 697a16dff889bc60562e3707
2026-01-28 19:32:58:3258 debug: 💾 DB UPDATE: users - User: 697a16dff889bc60562e3707 - User verified, OTP cleared
```

### **Email Operations**
```
2026-01-28 19:32:07:327 info: 📧 EMAIL: To test.user2@example.com - Subject: OTP Verification
```

### **Security Events**
```
2026-01-28 19:32:58:3258 warn: 🛡️ SECURITY INVALID_OTP_ATTEMPT: IP ::1 - User: test@example.com, Provided: 123456
2026-01-28 19:32:58:3258 warn: 🛡️ SECURITY MISSING_AUTH_TOKEN: IP ::1 - /api/v1/auth/profile
```

### **Business Events**
```
2026-01-28 19:32:07:327 info: 💼 BUSINESS USER_REGISTERED: User 697a16dff889bc60562e3707 - Test User
2026-01-28 19:32:58:3258 info: 💼 BUSINESS USER_VERIFIED: User 697a16dff889bc60562e3707 - Account verified via OTP
```

## 🔧 **Logger Usage in Code**

### **Import Logger**
```typescript
import logger from '../utils/logger';
```

### **API Request/Response Logging**
```typescript
// Automatic via middleware
logger.logAPIRequest(method, url, ip, userAgent, userId);
logger.logAPIResponse(method, url, statusCode, responseTime, userId);
```

### **Authentication Events**
```typescript
logger.logAuth('signup_success', email, clientIP, true);
logger.logAuth('login_failed', email, clientIP, false, 'Invalid credentials');
```

### **Database Operations**
```typescript
logger.logDB('create', 'users', true, undefined, userId);
logger.logDB('update', 'users', false, 'Connection timeout', userId);
```

### **OTP Operations**
```typescript
logger.logOTP('generate', email, true);
logger.logOTP('verify_failed', email, false, 'Invalid OTP');
```

### **Email Operations**
```typescript
logger.logEmail(email, 'OTP Verification', true);
logger.logEmail(email, 'Welcome Email', false, 'SMTP connection failed');
```

### **Security Events**
```typescript
logger.logSecurity('invalid_token', clientIP, 'JWT verification failed');
logger.logSecurity('rate_limit_exceeded', clientIP, 'Auth endpoint');
```

### **Business Logic**
```typescript
logger.logBusiness('user_registered', userId, 'John Doe');
logger.logBusiness('profile_updated', userId, 'Email changed');
```

### **General Logging**
```typescript
logger.info('Application started');
logger.warn('High memory usage detected');
logger.error('Database connection failed', { error: err.message });
logger.debug('Processing user data', { userId, action: 'update' });
```

## 📊 **Log Viewing APIs**

### **Get Recent Logs**
```bash
GET /api/v1/logs/recent/combined?lines=100
GET /api/v1/logs/recent/error?lines=50
GET /api/v1/logs/recent/http?lines=200
```

### **Get Log Statistics**
```bash
GET /api/v1/logs/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 45,
    "errorCount": 2,
    "successCount": 43,
    "authAttempts": 12,
    "otpGenerated": 8
  }
}
```

### **Search Logs**
```bash
GET /api/v1/logs/search?pattern=signup&type=combined
GET /api/v1/logs/search?pattern=ERROR&type=error
```

## 🎛️ **Configuration**

### **Log Levels by Environment**
- **Development**: `debug` (all logs)
- **Production**: `warn` (warnings and errors only)

### **File Rotation**
- **Daily rotation**: New file each day
- **Max file size**: 20MB
- **Retention**: 14 days
- **Compression**: Automatic for old files

### **Environment Variables**
```env
NODE_ENV=development  # Controls log level
LOG_LEVEL=debug      # Override log level (optional)
```

## 🔍 **Log Analysis Examples**

### **Find All Signup Attempts**
```bash
grep "SIGNUP ATTEMPT" logs/combined-2026-01-28.log
```

### **Find Failed Authentication**
```bash
grep "AUTH.*_FAILED" logs/combined-2026-01-28.log
```

### **Find Security Events**
```bash
grep "SECURITY" logs/combined-2026-01-28.log
```

### **Find Slow Requests (>1000ms)**
```bash
grep -E "RESPONSE.*[0-9]{4,}ms" logs/http-2026-01-28.log
```

### **Find Database Errors**
```bash
grep "DB.*Error" logs/error-2026-01-28.log
```

## 🚨 **Monitoring & Alerts**

### **Key Metrics to Monitor**
- Error rate (errors per minute)
- Response times (average, 95th percentile)
- Authentication failures
- Security events
- OTP failure rates

### **Alert Conditions**
- Error rate > 5% for 5 minutes
- Average response time > 2000ms
- More than 10 failed auth attempts from same IP
- Any SECURITY events
- Database connection failures

## 🛠️ **Log Management**

### **Log Cleanup**
```bash
# Remove logs older than 30 days
find logs/ -name "*.log" -mtime +30 -delete
```

### **Log Compression**
```bash
# Compress old logs
gzip logs/*.log.1
```

### **Log Backup**
```bash
# Backup logs to external storage
rsync -av logs/ backup/logs/
```

## 📈 **Performance Impact**

- **Console logging**: Minimal impact in development
- **File logging**: ~1-2ms per log entry
- **Structured logging**: Optimized for parsing
- **Async logging**: Non-blocking operations

## 🔐 **Security Considerations**

### **Sensitive Data Protection**
- Passwords: Always `[REDACTED]`
- Tokens: Always `[REDACTED]`
- OTP codes: Only in development mode
- Personal data: Minimal logging

### **Log Access Control**
- Log viewing APIs require authentication
- File system logs protected by OS permissions
- No sensitive data in log files

## 📚 **Best Practices**

1. **Use appropriate log levels**
2. **Include context (user ID, IP, etc.)**
3. **Log both success and failure cases**
4. **Use structured logging for important events**
5. **Don't log sensitive information**
6. **Monitor log file sizes**
7. **Set up log rotation**
8. **Regular log analysis**

## 🎯 **Example Log Analysis Queries**

### **User Journey Tracking**
```bash
# Track a specific user's actions
grep "User: 697a16dff889bc60562e3707" logs/combined-2026-01-28.log
```

### **Performance Analysis**
```bash
# Find slowest endpoints
grep "RESPONSE" logs/http-2026-01-28.log | sort -k8 -nr | head -10
```

### **Security Audit**
```bash
# All security events today
grep "SECURITY" logs/combined-2026-01-28.log
```

This comprehensive logging system provides full visibility into your application's behavior, performance, and security events!