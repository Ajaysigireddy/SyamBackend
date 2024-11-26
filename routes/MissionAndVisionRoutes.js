const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db'); // Assuming s3 and createFileName are set up correctly
const MissionAndVision = require('../models/MissionAndVision'); // Import your model
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid'); 
const path = require('path'); // For unique file names
const router = express.Router();

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const createFileName = (title, originalName) => {
    if (!originalName) {
      throw new Error("Invalid file name: originalName is undefined");
    }
    return `${title.replace(/\s+/g, '_')}_${uuidv4()}${path.extname(originalName)}`;
  };

// Route to update or create Mission and Vision
router.put('/update', upload.fields([
    { name: 'missionImage', maxCount: 1 },  // Mission image
    { name: 'visionImage', maxCount: 1 }    // Vision image
  ]), async (req, res) => {
    try {
      const { mission, vision } = req.body;
  
      if (!mission || !vision) {
        return res.status(400).json({ error: 'Mission and Vision text are required' });
      }
  
      // Prepare new data to be updated
      const updatedData = {};
  
      // Handle mission image upload to S3
      if (req.files && req.files.missionImage) {
        const missionFileName = createFileName('mission', req.files.missionImage[0].originalname);
        const missionUploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `mission-and-vision/${missionFileName}`,
          Body: req.files.missionImage[0].buffer,
          ContentType: req.files.missionImage[0].mimetype,
        };
  
        // Upload to S3
        await s3.send(new PutObjectCommand(missionUploadParams));
  
        // Save the image URL in the updated data
        updatedData.missionImage = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/mission-and-vision/${missionFileName}`;
      }
  
      // Handle vision image upload to S3
      if (req.files && req.files.visionImage) {
        const visionFileName = createFileName('vision', req.files.visionImage[0].originalname);
        const visionUploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `mission-and-vision/${visionFileName}`,
          Body: req.files.visionImage[0].buffer,
          ContentType: req.files.visionImage[0].mimetype,
        };
  
        // Upload to S3
        await s3.send(new PutObjectCommand(visionUploadParams));
  
        // Save the image URL in the updated data
        updatedData.visionImage = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/mission-and-vision/${visionFileName}`;
      }
  
      // If mission or vision text are provided, update those fields too
      if (mission) updatedData.mission = mission;
      if (vision) updatedData.vision = vision;
  
      // Find and update the Mission and Vision document in MongoDB or insert it if not found
      let missionAndVision = await MissionAndVision.findOne();
  
      if (missionAndVision) {
        // If document exists, update it
        missionAndVision = await MissionAndVision.findOneAndUpdate(
          {}, // Empty object to match the document
          { $set: updatedData }, // Update the fields with new data
          { new: true }
        );
      } else {
        // If document does not exist, create a new one
        missionAndVision = new MissionAndVision(updatedData);
        await missionAndVision.save();
      }
  
      res.status(200).json({
        message: missionAndVision ? 'Mission and Vision updated successfully' : 'Mission and Vision created successfully',
        missionAndVision: missionAndVision,
      });
    } catch (error) {
      console.error('Error updating Mission and Vision:', error);
      res.status(500).json({ error: 'Failed to update Mission and Vision' });
    }
  });



  // Route to get Mission and Vision
router.get('/get', async (req, res) => {
    try {
      // Find the Mission and Vision document in the database
      const missionAndVision = await MissionAndVision.findOne();
  
      // Check if the document exists
      if (!missionAndVision) {
        return res.status(404).json({ error: 'Mission and Vision data not found' });
      }
  
      // Send the Mission and Vision data as respons
      res.status(200).json({
        message: 'Mission and Vision data fetched successfully',
        missionAndVision: missionAndVision
      });
    } catch (error) {
      console.error('Error fetching Mission and Vision:', error);
      res.status(500).json({ error: 'Failed to fetch Mission and Vision data' });
    }
  });
  
  
  
  module.exports = router;