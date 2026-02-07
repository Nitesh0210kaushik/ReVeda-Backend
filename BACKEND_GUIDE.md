# ReVeda Backend Guide

This guide documents the architecture, authentication flow, and API endpoints of the ReVeda backend.

## 🏗️ Architecture Overview

The backend is built using a **Controller-Service-Repository** pattern with **Node.js (Express)**, **TypeScript**, and **MongoDB (Mongoose)**.

### Key Technologies & Libraries
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js (`v5`)
- **Database**: MongoDB (via `mongoose`)
- **Authentication**: JWT (`jsonwebtoken`) & Custom OTP System
- **Security**: `helmet` (headers), `cors` (origin control), `express-rate-limit` (brute-force protection)
- **Logging**: Custom logger (`winston` based) + `morgan` (HTTP requests)
- **Validation**: `joi` (Input validation)
- **Emails**: `nodemailer` (SMTP for OTPs)

---

## 🔐 Authentication Flow

The Authentication system is **OTP-based** (Passwordless) for maximum security and user convenience.

### 1. Signup Flow
1. **User Request**: Frontend sends `firstName`, `lastName`, `email`, `phoneNumber` to `/auth/signup`.
2. **Validation**: Input is validated using `Joi` schemas.
3. **Dup Check**: Backend checks if `email` or `phone` already exists.
4. **OTP Generation**: A 6-digit numeric OTP is generated.
5. **Storage**: User is created in DB with `isVerified: false` and the hashed OTP.
6. **Email**: OTP is sent to the user's email via `nodemailer`.
7. **Response**: Success message prompts frontend to navigate to Verify Screen.

### 2. Login Flow
1. **User Request**: Frontend sends `identifier` (Email or Phone) to `/auth/login`.
2. **Lookup**: User is searched by email or phone.
3. **OTP Generation**: New 6-digit OTP is generated.
4. **Update**: User record is updated with new OTP and Expiry.
5. **Email**: OTP is sent to the registered email.
6. **Response**: Success message prompts frontend to navigate to Verify Screen.

### 3. Verification Flow
1. **User Request**: Frontend sends `identifier` and `otp` to `/auth/verify-otp`.
2. **Validation**: Backend checks:
   - Does User exist?
   - Is OTP correct?
   - Is OTP expired?
3. **Success**:
   - `isVerified` set to `true`.
   - OTP is cleared from DB.
   - **JWT Tokens** (Access & Refresh) are generated.
4. **Response**: Returns Tokens + User Profile.

---

## 📡 API Endpoints

### Auth Routes (`/api/v1/auth`)

| Method | Endpoint         | Description                          | Auth Required |
|:-------|:-----------------|:-------------------------------------|:--------------|
| `POST` | `/signup`        | Register a new user & send OTP       | ❌ No          |
| `POST` | `/login`         | Request OTP for existing user        | ❌ No          |
| `POST` | `/verify-otp`    | Verify OTP and issue JWT tokens      | ❌ No          |
| `POST` | `/resend-otp`    | Re-send OTP if not received          | ❌ No          |
| `POST` | `/refresh-token` | Get new Access Token using Refresh   | ❌ No          |
| `GET`  | `/profile`       | Get current user details             | ✅ Yes         |

### Log Routes (`/api/v1/logs`)

| Method | Endpoint                | Description                          | Auth Required |
|:-------|:------------------------|:-------------------------------------|:--------------|
| `GET`  | `/recent`               | Get recent combined logs             | ✅ Yes         |
| `GET`  | `/recent/:type`         | Get recent logs by type (error/http) | ✅ Yes         |
| `GET`  | `/stats`                | Get log statistics                   | ✅ Yes         |
| `GET`  | `/search?pattern=xyz`   | Search logs for specific text        | ✅ Yes         |

---

## 🛠️ How It Works (Internals)

### Folder Structure
- **`src/controllers`**: Handles the request logic (req/res). `AuthController` manages the flows described above.
- **`src/services`** / **`src/utils`**: Helper logic.
    - `otpService`: Generates (`crypto.randomInt`) and Sends (`nodemailer`) OTPs.
    - `jwtService`: Signs and Verifies JWT tokens.
    - `logger`: Centralized logging service.
- **`src/models`**: Mongoose Schemas (User Model).
- **`src/middleware`**:
    - `auth`: Verifies JWT tokens on protected routes.
    - `rateLimiter`: Prevents spam (e.g., 5 login attempts per hour).
    - `validation`: Joi schema validator.

### Security Measures
- **Rate Limiting**: specific limiters for Auth vs General routes.
- **CORS**: Restricted to frontend origin.
- **Helmet**: Adds secure HTTP headers.
- **Input Sanitization**: Joi ensures only valid data hits the controller.

---

## 📝 Setup & Environment

Ensure your `.env` file has:
```env
MONGO_URI=mongodb://localhost:27017/reveda
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
FRONTEND_URL=http://localhost:8081
```
