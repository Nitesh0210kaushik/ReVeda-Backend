import doctorRepository from '../repositories/DoctorRepository';
import roleRepository from '../repositories/RoleRepository';
import userRepository from '../repositories/UserRepository';
import { IDoctor } from '../models/Doctor';

class DoctorService {
    async registerDoctor(data: any, files: any) {
        const {
            firstName, lastName, email, phoneNumber,
            specialization, experience, fee, bio,
            gender, registrationNumber
        } = data;

        // Extract file paths
        const imagePath = files?.['image']?.[0]?.path;
        const documentPaths = files?.['documents']?.map((file: any) => file.path) || [];

        // Check if doctor already exists
        const exists = await doctorRepository.existsByEmailOrPhoneOrReg(email, phoneNumber, registrationNumber);
        if (exists) {
            throw new Error('Doctor with this email, phone, or registration number already exists');
        }

        // Create new doctor
        const doctor = await doctorRepository.create({
            firstName, lastName, email, phoneNumber,
            specialization, experience, fee, bio,
            gender, registrationNumber,
            image: imagePath,
            documents: documentPaths,
            isVerified: false,
            kycVerify: false
        } as Partial<IDoctor>);

        // Create associated User entity for login
        const doctorRole = await roleRepository.findByName('Doctor');
        if (!doctorRole) throw new Error('Doctor Role not found');

        let user = await userRepository.findByEmail(email);
        if (!user) {
            await userRepository.create({
                firstName,
                lastName,
                email,
                phoneNumber,
                role: doctorRole._id,
                isVerified: false
            });
        } else {
            // Update existing user to Doctor role
            user.role = doctorRole._id;
            user.isVerified = false;
            await userRepository.updateById(user._id as unknown as string, { role: doctorRole._id, isVerified: false });
        }

        return doctor;
    }

    async getAllVerifiedDoctors() {
        return await doctorRepository.findVerifiedDoctors();
    }
}

export default new DoctorService();
