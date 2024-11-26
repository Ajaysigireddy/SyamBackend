const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db');  // Import S3 client from AWS SDK v3
const ChairmanMessage = require('../models/ChairmanMessage');  // Assuming ChairmanMessage model
const { v4: uuidv4 } = require('uuid');  // For unique file names
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');  // AWS SDK v3 commands

const router = express.Router();

// Setup Multer (In-memory storage for handling image upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to create a new chairman message with optional images
router.post('/add', upload.fields([{ name: 'chairmanPhoto' }, { name: 'chairmanMessagePhoto' }, { name: 'chairmanMessageBanner' }]), async (req, res) => {
  const { aboutChairman, chairmanMessage, chairmanPhotoRedirect, chairmanMessageRedirect } = req.body;

  try {
    let photoUrl = null, messagePhotoUrl = null, bannerUrl = null;

    // Handle chairmanPhoto upload
    if (req.files['chairmanPhoto']) {
      const imageKey = `chairman_photos/${uuidv4()}${path.extname(req.files['chairmanPhoto'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['chairmanPhoto'][0].buffer,
        ContentType: req.files['chairmanPhoto'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Handle chairmanMessagePhoto upload
    if (req.files['chairmanMessagePhoto']) {
      const imageKey = `chairman_message_photos/${uuidv4()}${path.extname(req.files['chairmanMessagePhoto'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['chairmanMessagePhoto'][0].buffer,
        ContentType: req.files['chairmanMessagePhoto'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      messagePhotoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Handle chairmanMessageBanner upload
    if (req.files['chairmanMessageBanner']) {
      const imageKey = `chairman_banners/${uuidv4()}${path.extname(req.files['chairmanMessageBanner'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['chairmanMessageBanner'][0].buffer,
        ContentType: req.files['chairmanMessageBanner'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      bannerUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Create a new chairman message document in MongoDB
    const newChairmanMessage = new ChairmanMessage({
      chairmanMessageBanner: bannerUrl,
      aboutChairman,
      chairmanPhoto: photoUrl,
      chairmanPhotoRedirect,
      chairmanMessage,
      chairmanMessagePhoto: messagePhotoUrl,
      chairmanMessageRedirect,
    });

    // Save the chairman message in MongoDB
    await newChairmanMessage.save();

    // Return the created chairman message
    res.status(201).json(newChairmanMessage);

  } catch (error) {
    console.error('Error uploading image or saving chairman message:', error);
    res.status(500).json({ error: 'Failed to upload image or save chairman message' });
  }
});

// Route to update a chairman message with optional image uploads
router.put('/edit/:id', upload.fields([{ name: 'chairmanPhoto' }, { name: 'chairmanMessagePhoto' }, { name: 'chairmanMessageBanner' }]), async (req, res) => {
  const { aboutChairman, chairmanMessage, chairmanPhotoRedirect, chairmanMessageRedirect } = req.body;

  try {
    // Find the chairman message by ID
    const chairmanMessageDoc = await ChairmanMessage.findById(req.params.id);
    if (!chairmanMessageDoc) {
      return res.status(404).json({ error: 'Chairman message not found' });
    }

    // Handle chairmanPhoto upload if provided
    if (req.files['chairmanPhoto']) {
      const imageKey = `chairman_photos/${uuidv4()}${path.extname(req.files['chairmanPhoto'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['chairmanPhoto'][0].buffer,
        ContentType: req.files['chairmanPhoto'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      chairmanMessageDoc.chairmanPhoto = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Handle chairmanMessagePhoto upload if provided
    if (req.files['chairmanMessagePhoto']) {
      const imageKey = `chairman_message_photos/${uuidv4()}${path.extname(req.files['chairmanMessagePhoto'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['chairmanMessagePhoto'][0].buffer,
        ContentType: req.files['chairmanMessagePhoto'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      chairmanMessageDoc.chairmanMessagePhoto = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Handle chairmanMessageBanner upload if provided
    if (req.files['chairmanMessageBanner']) {
      const imageKey = `chairman_banners/${uuidv4()}${path.extname(req.files['chairmanMessageBanner'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['chairmanMessageBanner'][0].buffer,
        ContentType: req.files['chairmanMessageBanner'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      chairmanMessageDoc.chairmanMessageBanner = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Update other fields
    chairmanMessageDoc.aboutChairman = aboutChairman || chairmanMessageDoc.aboutChairman;
    chairmanMessageDoc.chairmanMessage = chairmanMessage || chairmanMessageDoc.chairmanMessage;
    chairmanMessageDoc.chairmanPhotoRedirect = chairmanPhotoRedirect || chairmanMessageDoc.chairmanPhotoRedirect;
    chairmanMessageDoc.chairmanMessageRedirect = chairmanMessageRedirect || chairmanMessageDoc.chairmanMessageRedirect;

    // Save the updated chairman message in MongoDB
    await chairmanMessageDoc.save();

    res.status(200).json(chairmanMessageDoc);

  } catch (error) {
    console.error('Error updating chairman message:', error);
    res.status(500).json({ error: 'Failed to update chairman message' });
  }
});

// Route to delete a chairman message
router.delete('/delete/:id', async (req, res) => {
  try {
    // Find the chairman message by ID
    const chairmanMessageDoc = await ChairmanMessage.findById(req.params.id);
    if (!chairmanMessageDoc) {
      return res.status(404).json({ error: 'Chairman message not found' });
    }

    // If a chairmanPhoto exists, delete it from S3
    if (chairmanMessageDoc.chairmanPhoto) {
      const imageKey = chairmanMessageDoc.chairmanPhoto.split('.com/')[1];  // Get the S3 key part of the URL
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
      };
      await s3.send(new DeleteObjectCommand(params));
    }

    // If a chairmanMessagePhoto exists, delete it from S3
    if (chairmanMessageDoc.chairmanMessagePhoto) {
      const imageKey = chairmanMessageDoc.chairmanMessagePhoto.split('.com/')[1];
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
      };
      await s3.send(new DeleteObjectCommand(params));
    }

    // If a chairmanMessageBanner exists, delete it from S3
    if (chairmanMessageDoc.chairmanMessageBanner) {
      const imageKey = chairmanMessageDoc.chairmanMessageBanner.split('.com/')[1];
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
      };
      await s3.send(new DeleteObjectCommand(params));
    }

    // Delete the chairman message from MongoDB
    await ChairmanMessage.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Chairman message and associated images deleted successfully' });

  } catch (error) {
    console.error('Error deleting chairman message:', error);
    res.status(500).json({ error: 'Failed to delete chairman message' });
  }
});

// Route to get all chairman messages
router.get('/all', async (req, res) => {
  try {
    // Fetch all chairman messages from MongoDB
    const chairmanMessages = await ChairmanMessage.find();

    // Return the chairman messages as JSON
    res.status(200).json(chairmanMessages);

  } catch (error) {
    console.error('Error fetching chairman messages:', error);
    res.status(500).json({ error: 'Failed to fetch chairman messages' });
  }
});

module.exports = router;
