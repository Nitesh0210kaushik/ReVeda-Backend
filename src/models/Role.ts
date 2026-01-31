import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
    name: string;
    slug: string;
    description?: string;
    permissions?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const roleSchema = new Schema<IRole>({
    name: {
        type: String,
        required: [true, 'Role name is required'],
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Role slug is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    permissions: [{
        type: String
    }]
}, {
    timestamps: true
});

export default mongoose.model<IRole>('Role', roleSchema);
