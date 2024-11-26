const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db');  // AWS S3 client
const Material = require('../models/Material');
const { v4: uuidv4 } = require('uuid');  // For unique file names
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');  // AWS SDK v3 commands

const router = express.Router();

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Generate unique file names
const createFileName = (name, originalName) => {
  return `${name.replace(/\s+/g, '_')}_${uuidv4()}${path.extname(originalName)}`;
};

// Add a new material (upload banner image)
router.post('/add', upload.single('banner'), async (req, res) => {
  const { name, price, stock, subtopic } = req.body;

  // Ensure the banner image is uploaded
  if (!req.file) {
    return res.status(400).send('Banner image is required');
  }

  try {
    // Upload banner image to S3
    const bannerKey = `materials/${createFileName(name, req.file.originalname)}`;
    const bannerParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: bannerKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };
    await s3.send(new PutObjectCommand(bannerParams));

    // Create and save the material in MongoDB with the S3 banner link
    const newMaterial = new Material({
      name,
      banner: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${bannerKey}`,
      price,
      stock: stock === 'true',  // Convert string to boolean
      subtopic  // Optional field
    });

    await newMaterial.save();
    res.status(201).json(newMaterial);
  } catch (error) {
    console.error('Error uploading banner image or saving material:', error);
    res.status(500).json({ error: 'Failed to upload banner image or save material' });
  }
});

// Update an existing material (update banner image if provided)
router.put('/edit/:id', upload.single('banner'), async (req, res) => {
  const { name, price, stock, subtopic } = req.body;

  try {
    // Find the material by ID
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Update banner image if provided
    if (req.file) {
      const bannerKey = `materials/${createFileName(name, req.file.originalname)}`;
      const bannerParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: bannerKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      await s3.send(new PutObjectCommand(bannerParams));
      material.banner = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${bannerKey}`;
    }

    // Update other fields
    material.name = name || material.name;
    material.price = price || material.price;
    material.stock = stock !== undefined ? stock === 'true' : material.stock;
    material.subtopic = subtopic || material.subtopic;  // Update optional field

    await material.save();
    res.status(200).json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// Delete a material and its associated banner image from S3
router.delete('/delete/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Delete banner image from S3
    const bannerKey = material.banner.split('.com/')[1];
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: bannerKey
    }));

    // Delete material from MongoDB
    await Material.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Material and associated banner image deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

// Fetch all materials
router.get('/all', async (req, res) => {
  try {
    const materials = await Material.find();
    res.status(200).json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

module.exports = router;
