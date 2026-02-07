# ReVeda Backend API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication Flow

### 1. User Signup
**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john.doe@example.com",
  "phoneNumber": "9876543210"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email with the OTP sent.",
  "data": {
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "john.doe@example.com",
    "phoneNumber": "9876543210"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### 2. User Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "identifier": "john.doe@example.com"
}
```
*Note: identifier can be email or phone number*

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email.",
  "data": {
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "john.doe@example.com",
    "phoneNumber": "9876543210"
  }
}
```

### 3. Verify OTP
**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "identifier": "john.doe@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "9876543210",
      "isVerified": true,
      "createdAt": "2024-01-28T10:30:00.000Z",
      "updatedAt": "2024-01-28T10:35:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 4. Resend OTP
**Endpoint:** `POST /auth/resend-otp`

**Request Body:**
```json
{
  "identifier": "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP resent successfully to your email."
}
```

### 5. Refresh Token
**Endpoint:** `POST /auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 6. Get User Profile (Protected)
**Endpoint:** `GET /auth/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "9876543210",
      "isVerified": true,
      "createdAt": "2024-01-28T10:30:00.000Z",
      "updatedAt": "2024-01-28T10:35:00.000Z"
    }
  }
}
```

## Health Check
**Endpoint:** `GET /health`

**Success Response (200):**
```json
{
  "success": true,
  "message": "ReVeda API is running",
  "timestamp": "2024-01-28T10:30:00.000Z",
  "environment": "development"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    },
    {
      "field": "phoneNumber", 
      "message": "Please enter a valid Indian phone number"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Auth endpoints | 10 requests | 15 minutes |
| OTP endpoints | 3 requests | 5 minutes |

## Token Information

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **OTP**: Valid for 10 minutes

## Testing with cURL

### Signup
```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "9876543210"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john.doe@example.com"
  }'
```

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john.doe@example.com",
    "otp": "123456"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Environment Setup for Email

To enable email OTP functionality, configure these environment variables:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Gmail App Password Setup:
1. Enable 2-factor authentication on Gmail
2. Go to Google Account → Security → App passwords
3. Generate a new app password
4. Use this password in `EMAIL_PASS`

## Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "ReVeda API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Signup",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"email\": \"john.doe@example.com\",\n  \"phoneNumber\": \"9876543210\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/auth/signup",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "signup"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api/v1"
    }
  ]
}
```