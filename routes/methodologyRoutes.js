const express = require('express');
const multer = require('multer');
const { s3 } = require('../config/db');  // Import S3 client from AWS SDK v3
const Methodology = require('../models/Methodology');  // Path to your Methodology model
const { v4: uuidv4 } = require('uuid');  // For unique file names
const path = require('path');
const { PutObjectCommand } = require('@aws-sdk/client-s3');  // AWS SDK v3 commands

const router = express.Router();

// Setup Multer (In-memory storage for handling image upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to create a new methodology with optional images
router.post('/add', upload.fields([{ name: 'bannerImage' }, { name: 'interactiveClassesBanner' }, { name: 'studyMaterialBanner' }, { name: 'assessmentsBanner' }]), async (req, res) => {
  const { highlightContent, interactiveClassesContent, studyMaterialContent, assessmentsContent } = req.body;

  try {
    let bannerImageUrl = null, interactiveClassesBannerUrl = null, studyMaterialBannerUrl = null, assessmentsBannerUrl = null;

    // Handle bannerImage upload
    if (req.files['bannerImage']) {
      const imageKey = `methodology_banners/${uuidv4()}${path.extname(req.files['bannerImage'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['bannerImage'][0].buffer,
        ContentType: req.files['bannerImage'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      bannerImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Handle interactiveClassesBanner upload
    if (req.files['interactiveClassesBanner']) {
      const imageKey = `interactive_classes_banners/${uuidv4()}${path.extname(req.files['interactiveClassesBanner'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['interactiveClassesBanner'][0].buffer,
        ContentType: req.files['interactiveClassesBanner'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      interactiveClassesBannerUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Handle studyMaterialBanner upload
    if (req.files['studyMaterialBanner']) {
      const imageKey = `study_material_banners/${uuidv4()}${path.extname(req.files['studyMaterialBanner'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['studyMaterialBanner'][0].buffer,
        ContentType: req.files['studyMaterialBanner'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      studyMaterialBannerUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Handle assessmentsBanner upload
    if (req.files['assessmentsBanner']) {
      const imageKey = `assessments_banners/${uuidv4()}${path.extname(req.files['assessmentsBanner'][0].originalname)}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: req.files['assessmentsBanner'][0].buffer,
        ContentType: req.files['assessmentsBanner'][0].mimetype,
      };
      await s3.send(new PutObjectCommand(params));
      assessmentsBannerUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    }

    // Create a new methodology document in MongoDB
    const newMethodology = new Methodology({
      bannerImage: bannerImageUrl,
      highlightContent,
      interactiveClassesContent,
      interactiveClassesBanner: interactiveClassesBannerUrl,
      studyMaterialContent,
      studyMaterialBanner: studyMaterialBannerUrl,
      assessmentsContent,
      assessmentsBanner: assessmentsBannerUrl,
    });

    // Save the methodology in MongoDB
    await newMethodology.save();

    res.status(201).json(newMethodology);

  } catch (error) {
    console.error('Error uploading images or saving methodology:', error);
    res.status(500).json({ error: 'Failed to upload images or save methodology' });
  }
});
// Route to get all methodologies
router.get('/all', async (req, res) => {
    try {
      const methodologies = await Methodology.find();
      res.status(200).json(methodologies);
    } catch (error) {
      console.error('Error fetching methodologies:', error);
      res.status(500).json({ error: 'Failed to fetch methodologies' });
    }
  });
// Route to get a methodology by ID
router.get('/:id', async (req, res) => {
    try {
      const methodology = await Methodology.findById(req.params.id);
      if (!methodology) {
        return res.status(404).json({ error: 'Methodology not found' });
      }
      res.status(200).json(methodology);
    } catch (error) {
      console.error('Error fetching methodology:', error);
      res.status(500).json({ error: 'Failed to fetch methodology' });
    }
  });
// Route to update methodology by ID with optional image uploads
router.put('/edit/:id', upload.fields([{ name: 'bannerImage' }, { name: 'interactiveClassesBanner' }, { name: 'studyMaterialBanner' }, { name: 'assessmentsBanner' }]), async (req, res) => {
    const { highlightContent, interactiveClassesContent, studyMaterialContent, assessmentsContent } = req.body;
  
    try {
      const methodologyDoc = await Methodology.findById(req.params.id);
      if (!methodologyDoc) {
        return res.status(404).json({ error: 'Methodology not found' });
      }
  
      // Handle bannerImage upload if provided
      if (req.files['bannerImage']) {
        const imageKey = `methodology_banners/${uuidv4()}${path.extname(req.files['bannerImage'][0].originalname)}`;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: imageKey,
          Body: req.files['bannerImage'][0].buffer,
          ContentType: req.files['bannerImage'][0].mimetype,
        };
        await s3.send(new PutObjectCommand(params));
        methodologyDoc.bannerImage = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
      }
  
      // Repeat for other image fields (interactiveClassesBanner, studyMaterialBanner, assessmentsBanner)
  
      methodologyDoc.highlightContent = highlightContent || methodologyDoc.highlightContent;
      methodologyDoc.interactiveClassesContent = interactiveClassesContent || methodologyDoc.interactiveClassesContent;
      methodologyDoc.studyMaterialContent = studyMaterialContent || methodologyDoc.studyMaterialContent;
      methodologyDoc.assessmentsContent = assessmentsContent || methodologyDoc.assessmentsContent;
  
      // Save the updated methodology in MongoDB
      await methodologyDoc.save();
  
      res.status(200).json(methodologyDoc);
  
    } catch (error) {
      console.error('Error updating methodology:', error);
      res.status(500).json({ error: 'Failed to update methodology' });
    }
  });
// Route to delete methodology by ID
router.delete('/delete/:id', async (req, res) => {
    try {
      const methodologyDoc = await Methodology.findById(req.params.id);
      if (!methodologyDoc) {
        return res.status(404).json({ error: 'Methodology not found' });
      }
  
      // If there are any banners, delete them from S3
      const deleteBannerFromS3 = async (url) => {
        if (url) {
          const imageKey = url.split('.com/')[1];
          const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: imageKey };
          await s3.send(new DeleteObjectCommand(params));
        }
      };
  
      // Delete all banner images from S3
      await deleteBannerFromS3(methodologyDoc.bannerImage);
      await deleteBannerFromS3(methodologyDoc.interactiveClassesBanner);
      await deleteBannerFromS3(methodologyDoc.studyMaterialBanner);
      await deleteBannerFromS3(methodologyDoc.assessmentsBanner);
  
      // Delete the methodology document
      await Methodology.findByIdAndDelete(req.params.id);
  
      res.status(200).json({ message: 'Methodology and associated images deleted successfully' });
  
    } catch (error) {
      console.error('Error deleting methodology:', error);
      res.status(500).json({ error: 'Failed to delete methodology' });
    }
  });

  module.exports = router;