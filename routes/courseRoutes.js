const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db'); // AWS S3 client
const Course = require('../models/Course');
const { v4: uuidv4 } = require('uuid'); // For unique file names
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3'); // AWS SDK v3 commands

const router = express.Router();

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Generate unique file names for banner images
const createFileName = (courseName, originalName) => {
  return `${courseName.replace(/\s+/g, '_')}_${uuidv4()}${path.extname(originalName)}`;
};

// Add a new course with optional banner image upload
router.post('/add', upload.single('bannerImg'), async (req, res) => {
  const { courseName, medium, mode, category } = req.body;

  // Ensure the required fields are provided
  if (!courseName || !medium || !mode || !category) {
    return res.status(400).send('All fields except banner image are required');
  }

  try {
    let bannerImageUrl = null;
    
    // Upload banner image to S3 (if it exists)
    if (req.file) {
      const bannerImageKey = `courses/banner/${createFileName(courseName, req.file.originalname)}`;
      const bannerImageParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: bannerImageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      await s3.send(new PutObjectCommand(bannerImageParams));
      bannerImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${bannerImageKey}`;
    }

    // Create and save the new course in MongoDB with file link if available
    const newCourse = new Course({
      courseName,
      medium,
      mode,
      category,
      bannerImg: bannerImageUrl
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error uploading banner image or saving course:', error);
    res.status(500).json({ error: 'Failed to upload banner image or save course' });
  }
});

// Get all courses
router.get('/all', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Update an existing course (update banner image)
router.put('/edit/:id', upload.single('bannerImg'), async (req, res) => {
  const { courseName, medium, mode, category } = req.body;

  try {
    // Find the course by ID
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    let bannerImageUrl = course.bannerImg;

    // Update banner image if provided
    if (req.file) {
      const bannerImageKey = `courses/banner/${createFileName(courseName, req.file.originalname)}`;
      const bannerImageParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: bannerImageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      await s3.send(new PutObjectCommand(bannerImageParams));
      bannerImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${bannerImageKey}`;
    }

    // Update course details
    course.courseName = courseName || course.courseName;
    course.medium = medium || course.medium;
    course.mode = mode || course.mode;
    course.category = category || course.category;
    course.bannerImg = bannerImageUrl;

    await course.save();
    res.status(200).json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete a course and associated banner image from S3
router.delete('/delete/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete banner image from S3 if it exists
    if (course.bannerImg) {
      const bannerImageKey = course.bannerImg.split('.com/')[1];
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: bannerImageKey
      }));
    }

    // Delete course from MongoDB
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Course and associated files deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

module.exports = router;
