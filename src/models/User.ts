import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  password?: string;
  isVerified: boolean;
  otp?: string;
  role: any; // Can be string (legacy) or Populated Role object
  otpExpiry?: Date;
  googleId?: string; // Added for Google Login
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
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
    // required: [true, 'Phone number is required'], // Made optional for Google Login
    unique: true,
    sparse: true, // Allow multiple null/undefined values
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  profilePicture: {
    type: String
  },
  googleId: { // Added for Google Login
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role'
    // Default will be handled by controller code or we can set a default ID if known (not recommended for dynamic IDs)
  },
  otpExpiry: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output and FLATTEN role object
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.otp;
  delete userObject.otpExpiry;

  // Flatten role if it's populated (so frontend receives "Patient" string instead of object)
  if (userObject.role && typeof userObject.role === 'object' && userObject.role.name) {
    userObject.role = userObject.role.name;
  }

  return userObject;
};

export default mongoose.model<IUser>('User', userSchema);