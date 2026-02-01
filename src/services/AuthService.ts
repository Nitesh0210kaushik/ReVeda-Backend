import userRepository from '../repositories/UserRepository';
import roleRepository from '../repositories/RoleRepository';
import otpService from '../utils/otpService';
import jwtService from '../utils/jwtService';
import logger from '../utils/logger';
import User, { IUser } from '../models/User'; // Still need interface, eventually move to types

class AuthService {

    // Helper to send OTP based on available contact info
    private async sendOTP(user: IUser, otp: string): Promise<boolean> {
        // Simple heuristic: if the login identifier was phone, we might want to prioritize SMS.
        // But here we rely on what's available availability.
        // Let's prioritize Phone for SMS if we have a way to know the context, 
        // BUT for now, let's just send to Email if available, and SMS if available, or just one.
        // Better approach: Check if the user was found by phone or email in Login? 
        // We don't accept context in this helper.

        // Let's implement a smarter approach directly in the methods.
        return true;
    }

    async signup(data: { firstName: string, lastName: string, email: string, phoneNumber: string }) {
        const { firstName, lastName, email, phoneNumber } = data;

        // Check if user already exists
        const existingUser = await userRepository.existsByEmailOrPhone(email, phoneNumber);
        if (existingUser) {
            throw new Error('User with this email or phone number already exists');
        }

        // Fetch default Patient role
        const patientRole = await roleRepository.findByName('Patient');
        if (!patientRole) {
            throw new Error('Default Patient role not found');
        }

        // Generate OTP
        const otp = otpService.generateOTP();
        const otpExpiry = otpService.getOTPExpiry();

        const user = await userRepository.create({
            firstName,
            lastName,
            email,
            phoneNumber,
            otp,
            otpExpiry,
            role: patientRole._id,
            isVerified: false
        });

        // Send OTP
        let sent = false;
        // Prioritize sending to the identifier that is explicitly provided?
        // Usually signup requires email.
        if (email) {
            sent = await otpService.sendOTPEmail(email, otp, firstName);
        } else if (phoneNumber) {
            sent = await otpService.sendOTPSMS(phoneNumber, otp);
        }

        if (!sent) {
            // Rollback
            await userRepository.deleteById(user._id as unknown as string);
            throw new Error('Failed to send OTP');
        }

        return user;
    }

    async login(identifier: string) {
        const user = await userRepository.findByEmailOrPhone(identifier);
        if (!user) {
            throw new Error('User not found. Please signup first.');
        }

        // Check doctor verification
        await user.populate('role');
        const userRole = user.role as any;

        if (userRole?.name === 'Doctor' && !user.isVerified) {
            throw new Error('Your account is pending Admin approval. Please wait for verification.');
        }

        // Generate/Update OTP
        const otp = otpService.generateOTP();
        const otpExpiry = otpService.getOTPExpiry();

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP based on identifier type
        const isPhone = /^[0-9+]{10,15}$/.test(identifier);
        let sent = false;

        if (isPhone && user.phoneNumber) {
            sent = await otpService.sendOTPSMS(user.phoneNumber, otp);
        } else if (user.email) {
            sent = await otpService.sendOTPEmail(user.email, otp, user.firstName);
        } else if (user.phoneNumber) {
            // Fallback to phone if email missing
            sent = await otpService.sendOTPSMS(user.phoneNumber, otp);
        }

        if (!sent) {
            throw new Error('Failed to send OTP. Please try again.');
        }

        return user;
    }

    async verifyOTP(identifier: string, otp: string) {
        const user = await userRepository.findByEmailOrPhone(identifier);
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.otp || user.otp !== otp) {
            throw new Error('Invalid OTP');
        }

        if (!user.otpExpiry || new Date() > user.otpExpiry) {
            throw new Error('OTP expired');
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpiry = undefined;

        // Verify user if not verified
        if (!user.isVerified) {
            user.isVerified = true;
        }

        await user.save();

        // Generate tokens
        const tokens = jwtService.generateTokens(user);

        return { user, tokens };
    }

    async resendOTP(identifier: string) {
        const user = await userRepository.findByEmailOrPhone(identifier);
        if (!user) {
            throw new Error('User not found');
        }

        const otp = otpService.generateOTP();
        const otpExpiry = otpService.getOTPExpiry();

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        const isPhone = /^[0-9+]{10,15}$/.test(identifier);
        let sent = false;

        if (isPhone && user.phoneNumber) {
            sent = await otpService.sendOTPSMS(user.phoneNumber, otp);
        } else if (user.email) {
            sent = await otpService.sendOTPEmail(user.email, otp, user.firstName);
        } else {
            sent = await otpService.sendOTPSMS(user.phoneNumber, otp);
        }

        if (!sent) {
            throw new Error('Failed to send OTP');
        }

        return true;
    }

    async refreshToken(token: string) {
        const decoded = jwtService.verifyRefreshToken(token);
        const user = await userRepository.findById(decoded.userId);

        if (!user) {
            throw new Error('User not found');
        }

        const tokens = jwtService.generateTokens(user);
        return { tokens, user };
    }

    async loginWithGoogle(idToken: string) {
        // Mock Login for Development
        if (process.env.NODE_ENV === 'development' && idToken === 'mock-google-id-token-dev') {
            const user = await userRepository.findByEmail('test.user@example.com');
            if (user) {
                const tokens = jwtService.generateTokens(user);
                return { user, tokens };
            }
            // Create mock user if not exists
            const patientRole = await roleRepository.findByName('Patient');
            const newUser = await userRepository.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test.user@example.com',
                phoneNumber: '9999999999',
                role: patientRole?._id,
                isVerified: true,
                googleId: 'mock-google-id'
            } as any);
            const tokens = jwtService.generateTokens(newUser);
            return { user: newUser, tokens };
        }

        const { OAuth2Client } = require('google-auth-library');
        // Client ID should be in env, but for now we'll accept any valid token signed by Google
        // In production, PASS THE CLIENT_ID here to ensure token is for THIS app
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        });

        const payload = ticket.getPayload();

        if (!payload) {
            throw new Error('Invalid Google Token');
        }

        const { email, given_name, family_name, picture, sub: googleId } = payload;

        if (!email) {
            throw new Error('Google account must have an email');
        }

        // Check if user exists
        let user = await userRepository.findByEmail(email);

        if (!user) {
            // Create new user
            const patientRole = await roleRepository.findByName('Patient');
            if (!patientRole) throw new Error('Default Patient role not found');

            user = await userRepository.create({
                firstName: given_name || 'User',
                lastName: family_name || '',
                email: email,
                phoneNumber: '', // Google doesn't always provide phone, handle later
                role: patientRole._id,
                isVerified: true, // Google verified
                profilePicture: picture,
                googleId: googleId
            } as any);
        } else {
            // Update existing user
            if (!user.isVerified) {
                user.isVerified = true;
            }
            // Update profile pic if missing
            if (!user.profilePicture && picture) {
                user.profilePicture = picture;
            }
            await user.save();
        }

        // Generate tokens
        const tokens = jwtService.generateTokens(user);
        return { user, tokens };
    }
}

export default new AuthService();
