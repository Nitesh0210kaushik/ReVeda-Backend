import mongoose from 'mongoose';

const connectDB = async (retries = 5, delay = 5000): Promise<void> => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const mongoURI = (isProduction && process.env.MONGO_URI_PROD)
            ? process.env.MONGO_URI_PROD
            : (process.env.MONGO_URI || 'mongodb://localhost:27017/reveda');

        console.log(`🔌 Connecting to MongoDB (${isProduction ? 'Production' : 'Development'})...`);

        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000 // Fail quickly if no connection
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        if (retries > 0) {
            console.log(`🔁 Retrying connection in ${delay / 1000} seconds... (${retries} attempts left)`);
            await new Promise(res => setTimeout(res, delay));
            return connectDB(retries - 1, delay);
        } else {
            console.error('❌ Failed to connect to MongoDB after multiple attempts.');
            process.exit(1);
        }
    }
};

export default connectDB;
