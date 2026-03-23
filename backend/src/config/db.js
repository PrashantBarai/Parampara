const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://2022dhruvmaurya_db_user:oWHaeLIil7udBSkQ@cluster0.qrnoxk2.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(uri);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Don't exit - let the server run even without DB for development
    console.error('Server will continue running without database connection');
  }
};

module.exports = connectDB;
