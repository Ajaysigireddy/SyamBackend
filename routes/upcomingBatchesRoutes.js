const express = require('express');
const UpcomingBatch = require('../models/UpcomingBatches'); // Assuming the model is in the 'models' directory

const router = express.Router();

// Create a new upcoming batch
router.post('/add-upcoming-batch', async (req, res) => {
  try {
    const { Branch, Course, StartDate, ContactNumber } = req.body;

    if (!Branch || !Course || !StartDate || !ContactNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newBatch = new UpcomingBatch({
      Branch,
      Course,
      StartDate,
      ContactNumber
    });

    await newBatch.save();
    res.status(201).json({ message: 'Upcoming batch added successfully', batch: newBatch });
  } catch (error) {
    console.error('Error adding batch:', error);
    res.status(500).json({ error: 'Failed to add upcoming batch' });
  }
});

// Get all upcoming batches
router.get('/get-upcoming-batches', async (req, res) => {
  try {
    const batches = await UpcomingBatch.find();
    res.status(200).json({ batches });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming batches' });
  }
});

// Get a specific upcoming batch by ID
router.get('/get-upcoming-batch/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await UpcomingBatch.findById(id);

    if (!batch) {
      return res.status(404).json({ error: 'Upcoming batch not found' });
    }

    res.status(200).json({ batch });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming batch' });
  }
});

// Update an upcoming batch by ID
router.put('/update-upcoming-batch/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Branch, Course, StartDate, ContactNumber } = req.body;

    if (!Branch || !Course || !StartDate || !ContactNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const updatedBatch = await UpcomingBatch.findByIdAndUpdate(
      id,
      { Branch, Course, StartDate, ContactNumber },
      { new: true }
    );

    if (!updatedBatch) {
      return res.status(404).json({ error: 'Upcoming batch not found' });
    }

    res.status(200).json({ message: 'Upcoming batch updated successfully', batch: updatedBatch });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Failed to update upcoming batch' });
  }
});

// Delete an upcoming batch by ID
router.delete('/delete-upcoming-batch/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBatch = await UpcomingBatch.findByIdAndDelete(id);

    if (!deletedBatch) {
      return res.status(404).json({ error: 'Upcoming batch not found' });
    }

    res.status(200).json({ message: 'Upcoming batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ error: 'Failed to delete upcoming batch' });
  }
});

// Delete all upcoming batches
router.delete('/delete-all-upcoming-batches', async (req, res) => {
  try {
    await UpcomingBatch.deleteMany();
    res.status(200).json({ message: 'All upcoming batches deleted successfully' });
  } catch (error) {
    console.error('Error deleting all batches:', error);
    res.status(500).json({ error: 'Failed to delete all upcoming batches' });
  }
});

module.exports = router;
