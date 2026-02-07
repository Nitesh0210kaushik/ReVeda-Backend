import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        // Use PROD URI if in production and it exists, otherwise fall back to standard MONGO_URI
        const mongoURI = (isProduction && process.env.MONGO_URI_PROD)
            ? process.env.MONGO_URI_PROD
            : (process.env.MONGO_URI || 'mongodb://localhost:27017/reveda');

        console.log(`🔌 Connecting to MongoDB (${isProduction ? 'Production' : 'Development'})...`);

        const conn = await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
