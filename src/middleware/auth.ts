import { Request, Response, NextFunction } from 'express';
import jwtService from '../utils/jwtService';
import User from '../models/User';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: any;
  userId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.logSecurity('missing_auth_token', clientIP, req.originalUrl);
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwtService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        logger.logSecurity('invalid_token_user_not_found', clientIP, `UserID: ${decoded.userId}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      req.user = user;
      req.userId = user._id.toString();
      
      logger.debug(`🔐 AUTH SUCCESS: ${user.email} accessing ${req.originalUrl}`);
      next();
    } catch (jwtError) {
      logger.logSecurity('invalid_jwt_token', clientIP, req.originalUrl);
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    logger.error(`💥 AUTHENTICATION ERROR: ${error}`, {
      ip: clientIP,
      url: req.originalUrl
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const requireVerification = (req: AuthRequest, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (!req.user.isVerified) {
    logger.logSecurity('unverified_user_access', clientIP, `User: ${req.user.email}, URL: ${req.originalUrl}`);
    return res.status(403).json({
      success: false,
      message: 'Please verify your account to access this resource.'
    });
  }
  
  logger.debug(`✅ VERIFICATION CHECK PASSED: ${req.user.email}`);
  next();
};