# ReVeda Backend Deployment Guide

Follow these steps to deploy the backend to a production environment (e.g., VPS, AWS, DigitalOcean).

## 1. Environment Setup

1.  **Clone/Pull Code**: Get the latest code on your server.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**:
    *   Create a `.env` file in the `backend` directory.
    *   Copy the contents from `.env.example`.
    *   **CRITICAL**: Update the values for production!

    ```env
    PORT=5000
    NODE_ENV=production  <-- IMPORTANT
    MONGO_URI=mongodb+srv://... (Your Production DB Connection String)
    JWT_SECRET= (Use a long, random string)
    FRONTEND_URL=https://your-domain.com (Your actual frontend domain)
    ```

## 2. Build the Project

Since we are using TypeScript, we need to compile the code to JavaScript.

```bash
npm run build
```

This will create a `dist` folder containing the compiled code.

## 3. Start the Server

### Option A: Simple Start (For testing)
```bash
npm start
```

### Option B: Using PM2 (Recommended for Production)
PM2 is a process manager that keeps your app running, restarts it if it crashes, and manages logs.

1.  **Install PM2**:
    ```bash
    npm install -g pm2
    ```
2.  **Start the App**:
    ```bash
    pm2 start dist/index.js --name "reveda-backend"
    ```
3.  **Save Process List** (so it auto-starts on reboot):
    ```bash
    pm2 save
    pm2 startup
    ```

## 4. Verification

*   Check logs: `pm2 logs reveda-backend`
*   Test API: Visit `https://your-domain.com/api/v1` (should return "ReVeda Backend API is running").

## Troubleshooting

*   **CORS Issues**: Ensure `FRONTEND_URL` in `.env` exactly matches your frontend domain (no trailing slash usually).
*   **Database Connection**: Ensure your server IP is whitelisted in MongoDB Atlas if applicable.
