import { Router } from 'express';
import authController from '../controllers/authController';
import { validate } from '../middleware/validation';
import { authenticate, requireVerification } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';
import {
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema
} from '../validators/authValidator';

import upload from '../middleware/upload';

const router = Router();

// Public routes
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/verify-otp', authLimiter, validate(verifyOTPSchema), authController.verifyOTP);
router.post('/resend-otp', otpLimiter, validate(resendOTPSchema), authController.resendOTP);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.get('/profile', authenticate, requireVerification, authController.getProfile);
router.post('/profile-image', authenticate, requireVerification, upload.single('profilePicture'), authController.uploadProfilePicture);

// Google Login
router.post('/google-login', (req, res) => authController.loginWithGoogle(req, res));

export default router;