import { Request, Response } from 'express';
import authService from '../services/AuthService';
import otpService from '../utils/otpService';
import jwtService from '../utils/jwtService';
import logger from '../utils/logger';

export class AuthController {
  // Signup with OTP verification
  async signup(req: Request, res: Response) {
    const startTime = Date.now();
    const { firstName, lastName, email, phoneNumber } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      logger.info(`🚀 SIGNUP ATTEMPT: ${email} from ${clientIP}`);

      const user = await authService.signup({ firstName, lastName, email, phoneNumber });

      logger.logEmail(email, 'OTP Verification', true);
      logger.logAuth('signup_success', email, clientIP, true);
      logger.logBusiness('user_registered', user._id.toString(), `${firstName} ${lastName}`);

      const responseTime = Date.now() - startTime;
      logger.info(`✅ SIGNUP COMPLETED: ${email} in ${responseTime}ms`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email with the OTP sent.',
        data: {
          userId: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      });
    } catch (error: any) {
      logger.error(`💥 SIGNUP ERROR: ${email} - ${error.message}`, {
        stack: error.stack,
        ip: clientIP,
        requestBody: { firstName, lastName, email, phoneNumber }
      });

      // Handle specific service errors (e.g. existing user)
      if (error.message.includes('already exists')) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Login with email or phone number
  async login(req: Request, res: Response) {
    const startTime = Date.now();
    const { identifier } = req.body; // Can be email or phone number
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      logger.info(`🔑 LOGIN ATTEMPT: ${identifier} from ${clientIP}`);

      const user = await authService.login(identifier);

      logger.logEmail(user.email, 'Login OTP', true);
      logger.logAuth('login_otp_sent', user.email, clientIP, true);

      const responseTime = Date.now() - startTime;
      logger.info(`✅ LOGIN OTP SENT: ${user.email} in ${responseTime}ms`);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your email.',
        data: {
          userId: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      });
    } catch (error: any) {
      logger.error(`💥 LOGIN ERROR: ${identifier} - ${error.message}`, {
        stack: error.stack,
        ip: clientIP
      });

      if (error.message.includes('User not found') || error.message.includes('verification')) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Verify OTP
  async verifyOTP(req: Request, res: Response) {
    const startTime = Date.now();
    const { identifier, otp } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      logger.info(`🔐 OTP VERIFICATION ATTEMPT: ${identifier} from ${clientIP}`);

      const result = await authService.verifyOTP(identifier, otp);

      logger.logOTP('verify_success', result.user.email, true);
      logger.logAuth('otp_verify_success', result.user.email, clientIP, true);
      logger.logBusiness('user_verified', result.user._id.toString(), 'Account verified via OTP');

      const responseTime = Date.now() - startTime;
      logger.info(`✅ OTP VERIFICATION COMPLETED: ${result.user.email} in ${responseTime}ms`);

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: result.user.toJSON(),
          tokens: result.tokens
        }
      });
    } catch (error: any) {
      logger.error(`💥 OTP VERIFICATION ERROR: ${identifier} - ${error.message}`, {
        stack: error.stack,
        ip: clientIP
      });

      if (error.message.includes('User not found') || error.message.includes('OTP')) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Resend OTP
  async resendOTP(req: Request, res: Response) {
    const { identifier } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      logger.info(`🔄 RESEND OTP ATTEMPT: ${identifier} from ${clientIP}`);

      await authService.resendOTP(identifier);

      logger.logAuth('resend_otp_success', identifier, clientIP, true);

      res.status(200).json({
        success: true,
        message: 'OTP resent successfully to your email.'
      });
    } catch (error: any) {
      logger.error(`💥 RESEND OTP ERROR: ${identifier} - ${error.message}`, {
        stack: error.stack,
        ip: clientIP
      });

      if (error.message.includes('User not found') || error.message.includes('send OTP')) {
        return res.status(error.message.includes('User') ? 404 : 500).json({ success: false, message: error.message });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Google Login
  async loginWithGoogle(req: Request, res: Response) {
    const { idToken } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      logger.info(`🌐 GOOGLE LOGIN ATTEMPT from ${clientIP}`);

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'Google ID Token is required'
        });
      }

      const { user, tokens } = await authService.loginWithGoogle(idToken);

      res.status(200).json({
        success: true,
        message: 'Google Login Successful',
        data: { user, tokens }
      });
    } catch (error: any) {
      logger.error(`💥 GOOGLE LOGIN ERROR - ${error.message}`, {
        stack: error.stack,
        ip: clientIP
      });
      res.status(401).json({
        success: false,
        message: error.message || 'Google Login Failed'
      });
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      logger.info(`🔄 TOKEN REFRESH ATTEMPT from ${clientIP}`);

      if (!refreshToken) {
        logger.logSecurity('missing_refresh_token', clientIP);
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      try {
        const { tokens, user } = await authService.refreshToken(refreshToken);

        res.status(200).json({
          success: true,
          message: 'Tokens refreshed successfully',
          data: { tokens, user }
        });
      } catch (serviceError: any) {
        logger.logSecurity('invalid_refresh_token', clientIP, serviceError.message);
        return res.status(401).json({
          success: false,
          message: serviceError.message || 'Invalid refresh token'
        });
      }
    } catch (error: any) {
      logger.error(`💥 TOKEN REFRESH ERROR - ${error.message}`, {
        stack: error.stack,
        ip: clientIP
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user profile
  async getProfile(req: any, res: Response) {
    const user = req.user;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      logger.info(`👤 PROFILE ACCESS: ${user.email} from ${clientIP}`);
      logger.logBusiness('profile_accessed', user._id.toString());

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: user.toJSON() }
      });
    } catch (error: any) {
      logger.error(`💥 PROFILE ERROR: ${user?.email || 'unknown'} - ${error.message}`, {
        stack: error.stack,
        ip: clientIP,
        userId: user?._id
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Upload Profile Picture
  async uploadProfilePicture(req: any, res: Response) {
    const user = req.user;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      logger.info(`📸 UPLOAD ATTEMPT: ${user.email} from ${clientIP}`);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Construct file path
      const profilePictureUrl = `uploads/${req.file.filename}`;

      // Update user
      user.profilePicture = profilePictureUrl;
      await user.save();

      logger.logDB('update', 'users', true, 'Profile picture updated', user._id.toString());
      logger.logBusiness('profile_picture_updated', user._id.toString());

      res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          profilePicture: profilePictureUrl,
          user: user.toJSON()
        }
      });
    } catch (error: any) {
      logger.error(`💥 UPLOAD ERROR: ${user?.email} - ${error.message}`, {
        stack: error.stack,
        ip: clientIP,
        userId: user?._id
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default new AuthController();