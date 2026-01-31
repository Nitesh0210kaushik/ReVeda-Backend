import { Router } from 'express';
import authRoutes from './authRoutes';
import doctorRoutes from './doctor.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);


// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ReVeda API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;