const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db');  // AWS S3 client
const ExamResult = require('../models/ExamResult');
const { v4: uuidv4 } = require('uuid');  // For unique file names
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');  // AWS SDK v3 commands

const router = express.Router();

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Generate unique file names
const createFileName = (title, originalName) => {
  return `${title.replace(/\s+/g, '_')}_${uuidv4()}${path.extname(originalName)}`;
};

// Add a new exam result (upload PDF and optional banner image)
router.post('/add', upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }]), async (req, res) => {
  const { title } = req.body;

  // Ensure the PDF file is uploaded
  if (!req.files.pdf) {
    return res.status(400).send('PDF file is required');
  }

  try {
    // Upload PDF to S3
    const pdfKey = `exam-results/${createFileName(title, req.files.pdf[0].originalname)}`;
    const pdfParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: pdfKey,
      Body: req.files.pdf[0].buffer,
      ContentType: req.files.pdf[0].mimetype
    };
    await s3.send(new PutObjectCommand(pdfParams));

    let bannerImageUrl = null;
    // Upload banner image to S3 (if it exists)
    if (req.files.bannerImage) {
      const bannerImageKey = `exam-results/banner/${createFileName(title, req.files.bannerImage[0].originalname)}`;
      const bannerImageParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: bannerImageKey,
        Body: req.files.bannerImage[0].buffer,
        ContentType: req.files.bannerImage[0].mimetype
      };
      await s3.send(new PutObjectCommand(bannerImageParams));
      bannerImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${bannerImageKey}`;
    }

    // Create and save the exam result in MongoDB with file links
    const newExam = new ExamResult({
      title,
      pdfLink: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfKey}`,
      bannerImage: bannerImageUrl
    });

    await newExam.save();
    res.status(201).json(newExam);
  } catch (error) {
    console.error('Error uploading PDF or banner image:', error);
    res.status(500).json({ error: 'Failed to upload PDF or banner image or save exam result' });
  }
});

// Update an existing exam result (update PDF or banner image)
router.put('/edit/:id', upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }]), async (req, res) => {
  const { title } = req.body;

  try {
    // Find the exam result by ID
    const exam = await ExamResult.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam result not found' });
    }

    // Update PDF if provided
    if (req.files.pdf) {
      const pdfKey = `exam-results/${createFileName(title, req.files.pdf[0].originalname)}`;
      const pdfParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: pdfKey,
        Body: req.files.pdf[0].buffer,
        ContentType: req.files.pdf[0].mimetype
      };
      await s3.send(new PutObjectCommand(pdfParams));
      exam.pdfLink = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfKey}`;
    }

    // Update banner image if provided
    if (req.files.bannerImage) {
      const bannerImageKey = `exam-results/banner/${createFileName(title, req.files.bannerImage[0].originalname)}`;
      const bannerImageParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: bannerImageKey,
        Body: req.files.bannerImage[0].buffer,
        ContentType: req.files.bannerImage[0].mimetype
      };
      await s3.send(new PutObjectCommand(bannerImageParams));
      exam.bannerImage = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${bannerImageKey}`;
    }

    // Update title if provided
    exam.title = title || exam.title;
    await exam.save();
    res.status(200).json(exam);
  } catch (error) {
    console.error('Error updating exam result:', error);
    res.status(500).json({ error: 'Failed to update exam result' });
  }
});

// Delete an exam result and associated files from S3
router.delete('/delete/:id', async (req, res) => {
  try {
    const exam = await ExamResult.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam result not found' });
    }

    // Delete PDF from S3
    const pdfKey = exam.pdfLink.split('.com/')[1];
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: pdfKey
    }));

    // Delete banner image from S3 if it exists
    if (exam.bannerImage) {
      const bannerImageKey = exam.bannerImage.split('.com/')[1];
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: bannerImageKey
      }));
    }

    // Delete exam result from MongoDB
    await ExamResult.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Exam result and associated files deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam result:', error);
    res.status(500).json({ error: 'Failed to delete exam result' });
  }
});

// Fetch all exam results
router.get('/all', async (req, res) => {
  try {
    const exams = await ExamResult.find();
    res.status(200).json(exams);
  } catch (error) {
    console.error('Error fetching exam result entries:', error);
    res.status(500).json({ error: 'Failed to fetch exam result entries' });
  }
});

module.exports = router;
