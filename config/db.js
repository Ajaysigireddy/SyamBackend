const mongoose = require('mongoose');
const { S3Client } = require('@aws-sdk/client-s3');  // Import S3Client for AWS SDK v3
require('dotenv').config();

// MongoDB Connection
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

// AWS S3 Configuration (AWS SDK v3)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = {
  connectToMongoDB,
  s3,  // Export the S3Client instance
};
