import { Request, Response } from 'express';
import doctorService from '../services/DoctorService';

export const registerDoctor = async (req: Request, res: Response) => {
    try {
        const doctor = await doctorService.registerDoctor(req.body, req.files);

        res.status(201).json({
            success: true,
            message: 'Doctor registered successfully',
            data: doctor
        });
    } catch (error: any) {
        console.error('Register Doctor Error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

export const getAllDoctors = async (req: Request, res: Response) => {
    try {
        const doctors = await doctorService.getAllVerifiedDoctors();

        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors
        });
    } catch (error: any) {
        console.error('Get Doctors Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
