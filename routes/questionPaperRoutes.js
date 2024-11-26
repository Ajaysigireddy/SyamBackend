const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db');  // Import S3 client from AWS SDK v3
const QuestionPaper = require('../models/QuestionPaper');
const { v4: uuidv4 } = require('uuid');  // For unique file names
const path = require('path');
const { PutObjectCommand,DeleteObjectCommand } = require('@aws-sdk/client-s3');  // Import PutObjectCommand for S3 operations

const router = express.Router();

// Setup Multer (In-memory storage for handling PDF upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Function to generate a unique filename for the PDF
const createPdfName = (title, originalName) => {
  return `${title.replace(/\s+/g, '_')}_${uuidv4()}${path.extname(originalName)}`;
};

// Route to handle question papers creation and PDF upload
router.post('/add', upload.single('pdf'), async (req, res) => {
  const { title } = req.body;  // Only title is required, as PDF is being uploaded

  // Check if the PDF file is uploaded
  if (!req.file) {
    return res.status(400).send('PDF file is required');
  }

  try {
    // Create a unique name for the PDF file
    const pdfKey = `question-papers/${createPdfName(title, req.file.originalname)}`;

    // Parameters for uploading the PDF to S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: pdfKey,  // S3 file path using the exam title
      Body: req.file.buffer,  // PDF content as buffer
      ContentType: req.file.mimetype  // Set correct content type for PDF
    };

    // Upload the PDF to S3
    await s3.send(new PutObjectCommand(params));

    // Create a new question papers document in MongoDB with the S3 PDF URL
    const newExam = new QuestionPaper({
      title,
      pdfLink: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfKey}`,  // S3 URL of the PDF
    });

    // Save the question papers entry in MongoDB
    await newExam.save();

    // Return the created question papers entry
    res.status(201).json(newExam);

  } catch (error) {
    console.error('Error uploading PDF or saving question papers:', error);
    res.status(500).json({ error: 'Failed to upload PDF or save question papers' });
  }
});

// Route to update an existing question papers with a new PDF file upload
router.put('/edit/:id', upload.single('pdf'), async (req, res) => {
  const { title } = req.body;

  try {
    // Find the question papers entry by ID
    const exam = await QuestionPaper.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'question papers not found' });
    }

    // If a new PDF file is uploaded, handle the file upload
    if (req.file) {
      // Generate a unique filename for the new PDF
      const pdfKey = `question-papers/${createPdfName(title, req.file.originalname)}`;

      // Upload the new PDF to S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: pdfKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      await s3.send(new PutObjectCommand(params));

      // Update the pdfLink in the question papers document
      exam.pdfLink = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfKey}`;
    }

    // Update the question papers details
    exam.title = title || exam.title;

    // Save the updated question papers entry in MongoDB
    await exam.save();

    // Return the updated question papers entry
    res.status(200).json(exam);

  } catch (error) {
    console.error('Error updating question papers:', error);
    res.status(500).json({ error: 'Failed to update question papers' });
  }
});

// Route to delete an question papers entry and the associated PDF
router.delete('/delete/:id', async (req, res) => {
  try {
    // Find the question papers entry by ID
    const exam = await QuestionPaper.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'question papers not found' });
    }

    // Extract the PDF file key from the PDF URL
    const pdfKey = exam.pdfLink.split('.com/')[1];  // Get the S3 key part of the URL

    // Delete the PDF file from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: pdfKey,
    };

    await s3.send(new DeleteObjectCommand(params));

    // Delete the question papers entry from MongoDB
    await QuestionPaper.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'question papers and PDF deleted successfully' });

  } catch (error) {
    console.error('Error deleting question papers:', error);
    res.status(500).json({ error: 'Failed to delete question papers' });
  }
});

// Route to get all question papers entries
router.get('/all', async (req, res) => {
  try {
    // Fetch all question papers entries from MongoDB
    const exams = await QuestionPaper.find();

    // Return the question papers entries as JSON
    res.status(200).json(exams);

  } catch (error) {
    console.error('Error fetching question papers entries:', error);
    res.status(500).json({ error: 'Failed to fetch question papers entries' });
  }
});

module.exports = router;
