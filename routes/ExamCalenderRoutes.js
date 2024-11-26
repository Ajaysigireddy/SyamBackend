const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db');  // Import S3 client from AWS SDK v3
const ExamCalendar = require('../models/ExamCalender');
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

// Route to handle exam calendar creation and PDF upload
router.post('/add', upload.single('pdf'), async (req, res) => {
  const { title } = req.body;  // Only title is required, as PDF is being uploaded

  // Check if the PDF file is uploaded
  if (!req.file) {
    return res.status(400).send('PDF file is required');
  }

  try {
    // Create a unique name for the PDF file
    const pdfKey = `exam-calendars/${createPdfName(title, req.file.originalname)}`;

    // Parameters for uploading the PDF to S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: pdfKey,  // S3 file path using the exam title
      Body: req.file.buffer,  // PDF content as buffer
      ContentType: req.file.mimetype  // Set correct content type for PDF
    };

    // Upload the PDF to S3
    await s3.send(new PutObjectCommand(params));

    // Create a new exam calendar document in MongoDB with the S3 PDF URL
    const newExam = new ExamCalendar({
      title,
      pdfLink: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfKey}`,  // S3 URL of the PDF
    });

    // Save the exam calendar entry in MongoDB
    await newExam.save();

    // Return the created exam calendar entry
    res.status(201).json(newExam);

  } catch (error) {
    console.error('Error uploading PDF or saving exam calendar:', error);
    res.status(500).json({ error: 'Failed to upload PDF or save exam calendar' });
  }
});

// Route to update an existing exam calendar with a new PDF file upload
router.put('/edit/:id', upload.single('pdf'), async (req, res) => {
  const { title } = req.body;

  try {
    // Find the exam calendar entry by ID
    const exam = await ExamCalendar.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam calendar not found' });
    }

    // If a new PDF file is uploaded, handle the file upload
    if (req.file) {
      // Generate a unique filename for the new PDF
      const pdfKey = `exam-calendars/${createPdfName(title, req.file.originalname)}`;

      // Upload the new PDF to S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: pdfKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      await s3.send(new PutObjectCommand(params));

      // Update the pdfLink in the exam calendar document
      exam.pdfLink = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfKey}`;
    }

    // Update the exam calendar details
    exam.title = title || exam.title;

    // Save the updated exam calendar entry in MongoDB
    await exam.save();

    // Return the updated exam calendar entry
    res.status(200).json(exam);

  } catch (error) {
    console.error('Error updating exam calendar:', error);
    res.status(500).json({ error: 'Failed to update exam calendar' });
  }
});

// Route to delete an exam calendar entry and the associated PDF
router.delete('/delete/:id', async (req, res) => {
  try {
    // Find the exam calendar entry by ID
    const exam = await ExamCalendar.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam calendar not found' });
    }

    // Extract the PDF file key from the PDF URL
    const pdfKey = exam.pdfLink.split('.com/')[1];  // Get the S3 key part of the URL

    // Delete the PDF file from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: pdfKey,
    };

    await s3.send(new DeleteObjectCommand(params));

    // Delete the exam calendar entry from MongoDB
    await ExamCalendar.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Exam calendar and PDF deleted successfully' });

  } catch (error) {
    console.error('Error deleting exam calendar:', error);
    res.status(500).json({ error: 'Failed to delete exam calendar' });
  }
});

// Route to get all exam calendar entries
router.get('/all', async (req, res) => {
  try {
    // Fetch all exam calendar entries from MongoDB
    const exams = await ExamCalendar.find();

    // Return the exam calendar entries as JSON
    res.status(200).json(exams);

  } catch (error) {
    console.error('Error fetching exam calendar entries:', error);
    res.status(500).json({ error: 'Failed to fetch exam calendar entries' });
  }
});

module.exports = router;
