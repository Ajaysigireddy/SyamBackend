const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db'); // AWS S3 client setup
const Portfolio = require('../models/Portfolio');
const { v4: uuidv4 } = require('uuid'); // For unique file names
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3'); // AWS SDK v3 commands

const router = express.Router();

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Generate unique file names for image uploads
const createFileName = (originalName) => {
  return `${uuidv4()}${path.extname(originalName)}`;
};

// Add a new portfolio item
router.post('/add', upload.single('imageUrl'), async (req, res) => {
  const { category } = req.body;

  // Ensure the required fields are provided
  if (!category) {
    return res.status(400).send('Category is required');
  }

  try {
    let imageUrl = null;

    // Upload image to S3 (if it exists)
    if (req.file) {
      const imageKey = `portfolio/${createFileName(req.file.originalname)}`;
      const imageParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      await s3.send(new PutObjectCommand(imageParams));
      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Create and save the new portfolio item
    const newPortfolio = new Portfolio({
      imageUrl,
      category
    });

    await newPortfolio.save();
    res.status(201).json(newPortfolio);
  } catch (error) {
    console.error('Error uploading image or saving portfolio:', error);
    res.status(500).json({ error: 'Failed to upload image or save portfolio' });
  }
});

// Get all portfolio items
router.get('/all', async (req, res) => {
  try {
    const portfolios = await Portfolio.find();
    res.status(200).json(portfolios);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
});

// Update an existing portfolio item
router.put('/edit/:id', upload.single('imageUrl'), async (req, res) => {
  const { category } = req.body;

  try {
    // Find the portfolio by ID
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    let imageUrl = portfolio.imageUrl;

    // Update image if provided
    if (req.file) {
      const imageKey = `portfolio/${createFileName(req.file.originalname)}`;
      const imageParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      await s3.send(new PutObjectCommand(imageParams));
      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Update portfolio details
    portfolio.category = category || portfolio.category;
    portfolio.imageUrl = imageUrl;

    await portfolio.save();
    res.status(200).json(portfolio);
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
});

// Delete a portfolio item and associated image from S3
router.delete('/delete/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    // Delete image from S3 if it exists
    if (portfolio.imageUrl) {
      const imageKey = portfolio.imageUrl.split('.com/')[1];
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey
      }));
    }

    // Delete portfolio from MongoDB
    await Portfolio.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Portfolio and associated files deleted successfully' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({ error: 'Failed to delete portfolio' });
  }
});

module.exports = router;
