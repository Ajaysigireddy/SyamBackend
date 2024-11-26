const express = require('express');
const FAQ = require('../models/Faq'); // Make sure the path to your model is correct

const router = express.Router();

// CREATE a new FAQ
router.post('/create-faq', async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const newFAQ = new FAQ({ question, answer });
    await newFAQ.save();

    res.status(201).json({ message: 'FAQ created successfully', faq: newFAQ });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// READ all FAQs
router.get('/all-faqs', async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.status(200).json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// READ a single FAQ by ID
router.get('/faq/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.status(200).json(faq);
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ' });
  }
});

// UPDATE a FAQ by ID
router.put('/update-faq/:id', async (req, res) => {
  try {
    const { question, answer } = req.body;

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      req.params.id,
      { question, answer },
      { new: true, runValidators: true }
    );

    if (!updatedFAQ) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.status(200).json({ message: 'FAQ updated successfully', faq: updatedFAQ });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// DELETE a FAQ by ID
router.delete('/delete-faq/:id', async (req, res) => {
  try {
    const deletedFAQ = await FAQ.findByIdAndDelete(req.params.id);

    if (!deletedFAQ) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.status(200).json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

router.delete('/delete-all-faqs', async (req, res) => {
    try {
      // Delete all documents in the Faq collection
      await FAQ.deleteMany({});
  
      res.status(200).json({
        message: 'All FAQs have been deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting all FAQs:', error);
      res.status(500).json({
        error: 'Failed to delete all FAQs'
      });
    }
  });


module.exports = router;
