const express = require('express');
const router = express.Router();
const SuccessStory = require('../models/SuccessStories'); // Import the SuccessStory model
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer'); // Import your file upload configuration
const { s3 } = require('../config/db')




// Setup Multer (In-memory storage for handling image uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create new Success Story (with photo upload to S3)
router.post('/add-success-story', upload.single('photo'), async (req, res) => {
  try {
    const { name, achievement } = req.body;

    if (!name || !achievement) {
      return res.status(400).json({ error: 'Name and achievement are required' });
    }

    let photoUrl = '';
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `success-stories/${fileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      await s3.send(new PutObjectCommand(uploadParams));

      photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/success-stories/${fileName}`;
    }

    const newSuccessStory = new SuccessStory({
      name,
      achievement,
      photo: photoUrl
    });

    await newSuccessStory.save();
    res.status(201).json({ message: 'Success Story added successfully', successStory: newSuccessStory });
  } catch (error) {
    console.error('Error adding success story:', error);
    res.status(500).json({ error: 'Failed to add success story' });
  }
});

// Get all Success Stories
router.get('/get-success-stories', async (req, res) => {
  try {
    const successStories = await SuccessStory.find();
    res.status(200).json(successStories);
  } catch (error) {
    console.error('Error fetching success stories:', error);
    res.status(500).json({ error: 'Failed to fetch success stories' });
  }
});

// Update Success Story by ID
router.put('/update-success-story/:id', upload.single('photo'), async (req, res) => {
  try {
    const { name, achievement } = req.body;
    const { id } = req.params;

    if (!name || !achievement) {
      return res.status(400).json({ error: 'Name and achievement are required' });
    }

    const updatedData = { name, achievement };

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `success-stories/${fileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      await s3.send(new PutObjectCommand(uploadParams));
      updatedData.photo = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/success-stories/${fileName}`;
    }

    const updatedSuccessStory = await SuccessStory.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedSuccessStory) {
      return res.status(404).json({ error: 'Success Story not found' });
    }

    res.status(200).json({ message: 'Success Story updated successfully', successStory: updatedSuccessStory });
  } catch (error) {
    console.error('Error updating success story:', error);
    res.status(500).json({ error: 'Failed to update success story' });
  }
});

// Delete Success Story by ID
router.delete('/delete-success-story/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the success story first
    const successStory = await SuccessStory.findById(id);

    if (!successStory) {
      return res.status(404).json({ error: 'Success Story not found' });
    }

    // If the success story has a photo, delete it from S3
    if (successStory.photo) {
      const fileKey = successStory.photo.split('/').pop();
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `success-stories/${fileKey}`,
      };

      await s3.send(new DeleteObjectCommand(deleteParams));
    }

    // Now delete the success story from the database
    await SuccessStory.findByIdAndDelete(id);

    res.status(200).json({ message: 'Success Story and its photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting success story:', error);
    res.status(500).json({ error: 'Failed to delete success story' });
  }
});

module.exports = router;
