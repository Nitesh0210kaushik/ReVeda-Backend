import { BaseRepository } from './BaseRepository';
import Doctor, { IDoctor } from '../models/Doctor';

class DoctorRepository extends BaseRepository<IDoctor> {
    constructor() {
        super(Doctor);
    }

    async findByEmail(email: string): Promise<IDoctor | null> {
        return this.model.findOne({ email });
    }

    async findByPhoneNumber(phoneNumber: string): Promise<IDoctor | null> {
        return this.model.findOne({ phoneNumber });
    }

    async findByRegistrationNumber(registrationNumber: string): Promise<IDoctor | null> {
        return this.model.findOne({ registrationNumber });
    }

    async findVerifiedDoctors(): Promise<IDoctor[]> {
        return this.model.find({ isVerified: true }).sort('-rating');
    }

    async existsByEmailOrPhoneOrReg(email: string, phoneNumber: string, registrationNumber: string): Promise<boolean> {
        const count = await this.model.countDocuments({
            $or: [{ email }, { phoneNumber }, { registrationNumber }]
        });
        return count > 0;
    }
}

export default new DoctorRepository();
