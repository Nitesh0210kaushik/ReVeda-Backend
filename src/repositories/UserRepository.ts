import { BaseRepository } from './BaseRepository';
import User, { IUser } from '../models/User';

export class UserRepository extends BaseRepository<IUser> {
    constructor() {
        super(User);
    }

    async findByEmailOrPhone(identifier: string): Promise<IUser | null> {
        return this.model.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { phoneNumber: identifier }
            ]
        });
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return this.model.findOne({ email: email.toLowerCase() });
    }

    async existsByEmailOrPhone(email: string, phoneNumber: string): Promise<boolean> {
        const count = await this.model.countDocuments({
            $or: [{ email }, { phoneNumber }]
        });
        return count > 0;
    }
}

export default new UserRepository();
