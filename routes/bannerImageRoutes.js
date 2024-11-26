const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db');  // Import S3 client from AWS SDK v3
const BannerImage = require('../models/BannerImage');  // BannerImage model
const { v4: uuidv4 } = require('uuid');  // For unique file names
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');  // AWS SDK v3 commands

const router = express.Router();

// Setup Multer (In-memory storage for handling image upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to create a new banner with image upload
router.post('/add', upload.single('bannerImage'), async (req, res) => {
  const { pageName } = req.body;

  try {
    let imageUrl = null;

    // Handle bannerImage upload
    if (req.file) {
      const imageKey = `banners/${uuidv4()}${path.extname(req.file.originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Create a new banner image document in MongoDB
    const newBannerImage = new BannerImage({
      pageName,
      imageUrl,
    });

    // Save the banner image in MongoDB
    await newBannerImage.save();

    res.status(201).json(newBannerImage);

  } catch (error) {
    console.error('Error uploading image or saving banner:', error);
    res.status(500).json({ error: 'Failed to upload image or save banner' });
  }
});

// Route to update an existing banner with new image
router.put('/edit/:id', upload.single('bannerImage'), async (req, res) => {
  const { pageName } = req.body;

  try {
    // Find the banner by ID
    const bannerImageDoc = await BannerImage.findById(req.params.id);
    if (!bannerImageDoc) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Handle bannerImage upload if provided
    if (req.file) {
      const imageKey = `banners/${uuidv4()}${path.extname(req.file.originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      bannerImageDoc.imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Update other fields
    bannerImageDoc.pageName = pageName || bannerImageDoc.pageName;

    // Save the updated banner image in MongoDB
    await bannerImageDoc.save();

    res.status(200).json(bannerImageDoc);

  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

// Route to delete a banner and its image from S3
router.delete('/delete/:id', async (req, res) => {
  try {
    // Find the banner by ID
    const bannerImageDoc = await BannerImage.findById(req.params.id);
    if (!bannerImageDoc) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Delete the image from S3 if exists
    if (bannerImageDoc.imageUrl) {
      const imageKey = bannerImageDoc.imageUrl.split('.com/')[1];  // Get the S3 key part of the URL
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
      };
      await s3.send(new DeleteObjectCommand(params));
    }

    // Delete the banner document from MongoDB
    await BannerImage.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Banner and associated image deleted successfully' });

  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// Route to get all banners
router.get('/all', async (req, res) => {
  try {
    // Fetch all banners from MongoDB
    const banners = await BannerImage.find();

    // Return the banners as JSON
    res.status(200).json(banners);

  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// Route to fetch a banner by page name
router.get('/:pageName', async (req, res) => {
    const { pageName } = req.params;
  
    try {
      // Find the banner(s) by pageName
      const bannerImages = await BannerImage.find({ pageName });
  
      if (bannerImages.length === 0) {
        return res.status(404).json({ error: 'No banners found for this page' });
      }
  
      // Return the banners as JSON
      res.status(200).json(bannerImages);
  
    } catch (error) {
      console.error('Error fetching banners by page name:', error);
      res.status(500).json({ error: 'Failed to fetch banners for this page' });
    }
  });


// Route to update an existing banner by pageName with new image
router.put('/editByPageName/:pageName', upload.single('bannerImage'), async (req, res) => {
    const { pageName } = req.params;
    const { newPageName } = req.body; // Optional, to update the pageName
  
    try {
      // Find the banner by pageName
      const bannerImageDoc = await BannerImage.findOne({ pageName });
      if (!bannerImageDoc) {
        return res.status(404).json({ error: 'Banner not found for this page' });
      }
  
      // Handle bannerImage upload if provided
      if (req.file) {
        const imageKey = `banners/${uuidv4()}${path.extname(req.file.originalname)}`;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: imageKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };
        await s3.send(new PutObjectCommand(params));
        bannerImageDoc.imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
      }
  
      // Update the pageName if provided
      bannerImageDoc.pageName = newPageName || bannerImageDoc.pageName;
  
      // Save the updated banner image in MongoDB
      await bannerImageDoc.save();
  
      res.status(200).json(bannerImageDoc);
  
    } catch (error) {
      console.error('Error updating banner:', error);
      res.status(500).json({ error: 'Failed to update banner' });
    }
  });
  

module.exports = router;
