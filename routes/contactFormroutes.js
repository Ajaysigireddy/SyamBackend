const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const json2xls = require('json2xls');
const fs = require('fs');
// const Form = require('../models/ContactForm');
const Form = require('../models/ContactForm');

require('dotenv').config();

const router = express.Router();

// POST route to submit form data
router.post('/submit-form', async (req, res) => {
  const formData = new Form(req.body);
  try {
    await formData.save();
    res.status(200).json({ message: 'Form submitted successfully!' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error submitting form!' });
  }
});

// GET route to fetch all form entries
router.get('/get-entries', async (req, res) => {
  try {
    // Fetch all data from the database, excluding MongoDB specific fields (_id, __v)
    const data = await Form.find({}, { _id: 0, __v: 0 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form entries!' });
  }
});

// GET route to download data in Excel
router.get('/download-excel', async (req, res) => {
  try {
    // Fetch data from MongoDB and exclude MongoDB specific fields (_id, __v)
    const data = await Form.find({}, { _id: 0, __v: 0 });

    // Format data for Excel export, including the timestamp and message field
    const formattedData = data.map((form) => ({
      Name: form.name,
      "Mobile Number": form.mobile,
      "Email ID": form.email,
      "Interested Course": form.course,
      City: form.city,
      Message: form.message, // Include the message field in the Excel export
      "Submission Time": form.timestamp.toLocaleString(), // Format the timestamp
    }));

    // Convert the formatted data to Excel format
    const xls = json2xls(formattedData);

    // Set the correct headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=form_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Send the Excel file as a buffer
    res.send(Buffer.from(xls, 'binary'));
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).json({ message: 'Error generating Excel file!' });
  }
});

module.exports = router;
