import express from 'express';
import { registerDoctor, getAllDoctors } from '../controllers/doctor.controller';
import upload from '../middleware/upload';

const router = express.Router();

router.post('/register', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'documents', maxCount: 3 }
]), registerDoctor);
router.get('/', getAllDoctors);

export default router;
