import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    specialization: string;
    experience: string;
    fee: string;
    bio?: string;
    image?: string;
    rating: number;
    isVerified: boolean;
    gender: 'Male' | 'Female' | 'Other';
    registrationNumber: string;
    kycVerify: boolean;
    documents: string[];
    createdAt: Date;
    updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        trim: true,
    },
    experience: {
        type: String, // e.g., "10 Years"
        required: [true, 'Experience is required'],
    },
    fee: {
        type: String, // e.g., "₹500"
        required: [true, 'Consultation fee is required'],
    },
    bio: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        default: 'https://i.pravatar.cc/150?img=11' // Default placeholder
    },
    rating: {
        type: Number,
        default: 5.0,
    },
    isVerified: {
        type: Boolean,
        default: false, // Changed to false: Admin must verify now
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, 'Gender is required'],
    },
    registrationNumber: {
        type: String,
        required: [true, 'Registration Number is required'],
        unique: true,
        trim: true,
    },
    kycVerify: {
        type: Boolean,
        default: false,
    },
    documents: [{
        type: String, // Paths to uploaded documents
    }],
}, {
    timestamps: true
});

export default mongoose.model<IDoctor>('Doctor', doctorSchema);
