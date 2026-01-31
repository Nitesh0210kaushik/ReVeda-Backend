# ReVeda Backend API

A professional Node.js backend with Express, TypeScript, and MongoDB for the ReVeda application.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with OTP verification
- 📧 **Email OTP**: Secure email-based OTP system
- 🛡️ **Security**: Helmet, CORS, rate limiting, input validation
- 📝 **Validation**: Joi-based request validation
- 🏗️ **Professional Structure**: Clean architecture with proper separation of concerns
- 📊 **Comprehensive Logging**: Winston-based logging with file rotation and structured logs
- 🔄 **Error Handling**: Comprehensive error handling middleware

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access & Refresh tokens)
- **Validation**: Joi
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston with daily file rotation
- **HTTP Logging**: Morgan

## Project Structure

```
backend/
├── src/
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware (auth, logging, validation)
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions (logger, JWT, OTP)
│   ├── validators/        # Request validators
│   ├── types/             # TypeScript types
│   ├── db/                # Database connection
│   └── index.ts           # Application entry point
├── logs/                  # Log files (auto-generated)
│   ├── combined-YYYY-MM-DD.log  # All logs
│   ├── error-YYYY-MM-DD.log     # Error logs
│   └── http-YYYY-MM-DD.log      # HTTP request logs
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env
```

## Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**:
   Update `.env` file with your configuration:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/reveda
   
   # JWT Secrets (Change in production!)
   JWT_ACCESS_SECRET=your-super-secret-access-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   
   # Email Configuration
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Server
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

3. **Gmail App Password Setup**:
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password: Google Account → Security → App passwords
   - Use the generated password in `EMAIL_PASS`

## Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication Routes (`/api/v1/auth`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/signup` | Register new user | `{ firstName, lastName, email, phoneNumber }` |
| POST | `/login` | Login with email/phone | `{ identifier }` |
| POST | `/verify-otp` | Verify OTP | `{ identifier, otp }` |
| POST | `/resend-otp` | Resend OTP | `{ identifier }` |
| POST | `/refresh-token` | Refresh access token | `{ refreshToken }` |
| GET | `/profile` | Get user profile | Headers: `Authorization: Bearer <token>` |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | API health status |

## Authentication Flow

### 1. Signup Flow
```
1. POST /api/v1/auth/signup
   → User provides: firstName, lastName, email, phoneNumber
   → System generates OTP and sends via email
   → Returns: userId, email, phoneNumber

2. POST /api/v1/auth/verify-otp
   → User provides: identifier (email/phone), otp
   → System verifies OTP and marks user as verified
   → Returns: user data + JWT tokens
```

### 2. Login Flow
```
1. POST /api/v1/auth/login
   → User provides: identifier (email or phone)
   → System generates OTP and sends via email
   → Returns: userId, email, phoneNumber

2. POST /api/v1/auth/verify-otp
   → User provides: identifier, otp
   → System verifies OTP
   → Returns: user data + JWT tokens
```

### 3. Token Usage
```
- Access Token: Short-lived (15 minutes), used for API requests
- Refresh Token: Long-lived (7 days), used to get new access tokens
- Include in headers: Authorization: Bearer <access_token>
```

## Security Features

- **Rate Limiting**: 
  - General API: 100 requests/15 minutes
  - Auth endpoints: 10 requests/15 minutes  
  - OTP endpoints: 3 requests/5 minutes
- **Input Validation**: Joi schemas for all inputs
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Security**: Separate secrets for access/refresh tokens
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **MongoDB Injection Protection**: Mongoose built-in protection

## Error Handling

All API responses follow this format:
```json
{
  "success": boolean,
  "message": string,
  "data": object,     // On success
  "error": string,    // On error (dev mode only)
  "errors": array     // Validation errors
}
```

## Logging System

The backend includes a comprehensive logging system with:

### **Features**
- **Multi-level logging**: error, warn, info, http, debug
- **File rotation**: Daily log files with automatic cleanup
- **Structured logging**: Consistent format with emojis and context
- **Multiple outputs**: Console (development) + Files (production)
- **Log categories**: Authentication, Database, Email, Security, Business events

### **Log Files**
- `logs/combined-YYYY-MM-DD.log` - All application logs
- `logs/error-YYYY-MM-DD.log` - Error logs only
- `logs/http-YYYY-MM-DD.log` - HTTP request/response logs

### **Sample Log Output**
```
2026-01-28 19:32:07:327 info: 🚀 SIGNUP ATTEMPT: user@example.com from ::1
2026-01-28 19:32:07:327 info: 🔑 OTP GENERATE: user@example.com
2026-01-28 19:32:07:327 debug: 💾 DB CREATE: users - User: 697a16dff889bc60562e3707
2026-01-28 19:32:07:327 info: 📧 EMAIL: To user@example.com - Subject: OTP Verification
2026-01-28 19:32:07:327 info: 🔐 AUTH SIGNUP_SUCCESS: user@example.com from ::1
2026-01-28 19:32:07:327 info: ✅ SIGNUP COMPLETED: user@example.com in 21ms
2026-01-28 19:32:07:327 http: ✅ RESPONSE: POST /api/v1/auth/signup - 201 - 24ms
```

### **Log Viewing APIs**
- `GET /api/v1/logs/recent/combined?lines=100` - View recent logs
- `GET /api/v1/logs/stats` - Get logging statistics
- `GET /api/v1/logs/search?pattern=signup` - Search logs

**For detailed logging documentation, see [LOGGING_GUIDE.md](LOGGING_GUIDE.md)**

## Development Guidelines

1. **Code Structure**: Follow the established folder structure
2. **Error Handling**: Always use try-catch in controllers
3. **Validation**: Validate all inputs using Joi schemas
4. **Security**: Never expose sensitive data in responses
5. **Logging**: Use structured logging with appropriate levels
6. **Environment**: Keep secrets in environment variables

## Production Deployment

1. **Environment Variables**: Update all secrets and configurations
2. **Database**: Use MongoDB Atlas or dedicated MongoDB server
3. **Email Service**: Configure production email service
4. **SSL**: Enable HTTPS
5. **Process Manager**: Use PM2 or similar
6. **Monitoring**: Add application monitoring
7. **Backup**: Set up database backups

## Future Enhancements

- [ ] SMS OTP integration (Twilio/AWS SNS)
- [ ] Social login (Google, Facebook)
- [ ] Password-based login option
- [ ] Email templates
- [ ] Push notifications
- [ ] Admin panel APIs
- [ ] API documentation (Swagger)
- [ ] Unit tests
- [ ] Docker containerization