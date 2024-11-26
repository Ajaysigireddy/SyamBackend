const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db');  // AWS S3 client
const Popup = require('../models/HomePage/PopUps');  // Popup model
const { v4: uuidv4 } = require('uuid');  // For unique file names
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');  // AWS SDK v3 commands

const router = express.Router();

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Generate unique file names for S3 storage
const createFileName = (originalName) => {
  return `${uuidv4()}${path.extname(originalName)}`;
};

// Add a new popup (upload image)
router.post('/add', upload.single('image'), async (req, res) => {
  const { link } = req.body;

  // Ensure the image file is uploaded
  if (!req.file) {
    return res.status(400).send('Image file is required');
  }

  try {
    // Upload image to S3
    const imageKey = `popups/${createFileName(req.file.originalname)}`;
    const imageParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };
    await s3.send(new PutObjectCommand(imageParams));

    // Create and save the popup in MongoDB
    const newPopup = new Popup({
      image: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`,
      link: link || null
    });

    await newPopup.save();
    res.status(201).json(newPopup);
  } catch (error) {
    console.error('Error uploading image or saving popup:', error);
    res.status(500).json({ error: 'Failed to upload image or save popup' });
  }
});

// Update an existing popup (update image or link)
router.put('/edit/:id', upload.single('image'), async (req, res) => {
  const { link } = req.body;

  try {
    // Find the popup by ID
    const popup = await Popup.findById(req.params.id);
    if (!popup) {
      return res.status(404).json({ error: 'Popup not found' });
    }

    // Update image if provided
    if (req.file) {
      const imageKey = `popups/${createFileName(req.file.originalname)}`;
      const imageParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      await s3.send(new PutObjectCommand(imageParams));

      // Delete old image from S3
      const oldImageKey = popup.image.split('.com/')[1];
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: oldImageKey
      }));

      // Update popup image URL
      popup.image = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Update link if provided
    popup.link = link || popup.link;

    await popup.save();
    res.status(200).json(popup);
  } catch (error) {
    console.error('Error updating popup:', error);
    res.status(500).json({ error: 'Failed to update popup' });
  }
});

// Delete a popup and associated image from S3
router.delete('/delete/:id', async (req, res) => {
  try {
    const popup = await Popup.findById(req.params.id);
    if (!popup) {
      return res.status(404).json({ error: 'Popup not found' });
    }

    // Delete image from S3
    const imageKey = popup.image.split('.com/')[1];
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageKey
    }));

    // Delete popup from MongoDB
    await Popup.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Popup and associated image deleted successfully' });
  } catch (error) {
    console.error('Error deleting popup:', error);
    res.status(500).json({ error: 'Failed to delete popup' });
  }
});

// Fetch all popups
router.get('/all', async (req, res) => {
  try {
    const popups = await Popup.find();
    res.status(200).json(popups);
  } catch (error) {
    console.error('Error fetching popups:', error);
    res.status(500).json({ error: 'Failed to fetch popups' });
  }
});

module.exports = router;
