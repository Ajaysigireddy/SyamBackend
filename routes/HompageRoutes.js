const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { s3 } = require('../config/db')
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');  // Import S3 commands
const BannerImage = require('../models/HomePage/bannerImages');
const ScrollingText = require('../models/HomePage/scrollingText');
const UpcomingExam=require('../models/HomePage/upcomingExam');
const Notification=require('../models/HomePage/notifications');
const Service=require('../models/HomePage/Service')
const Class=require('../models/HomePage/Class')
const StudentFeedback=require('../models/HomePage/StudentFeeback')
const InstitutionStats=require('../models/HomePage/InstitutionStats')
const { Upload } = require('@aws-sdk/lib-storage');
const PreparationActivity =require('../models/HomePage/PreparationActivities');
const Popup = require('../models/HomePage/PopUps');



const router = express.Router();

// Setup Multer (In-memory storage for handling image uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const createFileName2 = (originalName) => {
  return `${uuidv4()}${path.extname(originalName)}`;
};

const createFileName = (title, originalName) => {
  if (!originalName) {
    throw new Error("Invalid file name: originalName is undefined");
  }
  return `${title.replace(/\s+/g, '_')}_${uuidv4()}${path.extname(originalName)}`;
};

router.post('/add-banner-images', upload.array('bannerImages', 5), async (req, res) => {
  try {
      const bannerImages = [];

      // Check if files are provided
      if (req.files && req.files.length > 0) {
          // Loop through each file and upload to S3
          for (let file of req.files) {
              const fileName = createFileName('banner', file.originalname);

              const params = {
                  Bucket: process.env.AWS_BUCKET_NAME,
                  Key: `homepage/banners/${fileName}`,
                  Body: file.buffer,
                  ContentType: file.mimetype,
              };

              // Upload the file to S3
              await s3.send(new PutObjectCommand(params));

              // Construct the image URL
              const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/homepage/banners/${fileName}`;
              bannerImages.push(imageUrl);  // Add the URL to the array
          }
      }

      // Save banner image URLs to the BannerImage model
      const savedBannerImages = await BannerImage.insertMany(
          bannerImages.map(imageUrl => ({ url: imageUrl }))
      );

      // Optionally, update the Homepage model with the new banner image references
      await BannerImage.findOneAndUpdate(
          {},  // Update the first document found, or specify the document to update
          { $push: { bannerImages: { $each: savedBannerImages.map(img => img._id) } } },  // Push image IDs into the homepage's bannerImages array
          { new: true, upsert: true }  // Create a new homepage document if none exists
      );

      // Send success response
      res.status(201).json({
          message: 'Banner images uploaded and saved successfully',
          bannerImages: savedBannerImages,  // Return the array of saved BannerImage documents
      });
  } catch (error) {
      console.error('Error uploading banner images:', error);
      res.status(500).json({ error: 'Failed to upload banner images' });
  }
});
// Route to get all banner images
router.get('/banner-images', async (req, res) => {
  try {
      // Fetch all banner images from the BannerImage collection
      const bannerImages = await BannerImage.find({});

      // Send success response with the list of banner images
      res.status(200).json({
          message: 'Banner images fetched successfully',
          bannerImages,
      });
  } catch (error) {
      console.error('Error fetching banner images:', error);
      res.status(500).json({ error: 'Failed to fetch banner images' });
  }
});


// Route to delete a banner image by ID
router.delete('/banner-images/:id', async (req, res) => {
  try {
      const bannerImageId = req.params.id;

      // Find the banner image by its ID
      const bannerImage = await BannerImage.findById(bannerImageId);

      if (!bannerImage) {
          return res.status(404).json({ error: 'Banner image not found' });
      }

      // Extract the key (file path) from the image URL
      const s3Key = bannerImage.url.split(`${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];

      // Delete the image from S3
      const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
      };

      await s3.send(new DeleteObjectCommand(deleteParams));

      // Delete the image from MongoDB
      await BannerImage.findByIdAndDelete(bannerImageId);

      // Optionally, update the Homepage model to remove the reference
      await BannerImage.findOneAndUpdate(
          {},
          { $pull: { bannerImages: bannerImageId } }
      );

      // Send success response
      res.status(200).json({
          message: 'Banner image deleted successfully',
      });
  } catch (error) {
      console.error('Error deleting banner image:', error);
      res.status(500).json({ error: 'Failed to delete banner image' });
  }
});


// Route to create new scrolling text
router.post('/create-scrolling-text', async (req, res) => {
  try {
    const { text, link } = req.body;

    // Check if text is provided
    if (!text) {
      return res.status(400).json({ error: 'Scrolling text is required' });
    }

    // Create a new scrolling text document
    const newScrollingText = new ScrollingText({
      text,
      link: link || '', // Default to empty string if no link is provided
    });

    // Save the new scrolling text document
    await newScrollingText.save();

    res.status(201).json({
      message: 'Scrolling text created successfully',
      scrollingText: newScrollingText,
    });
  } catch (error) {
    console.error('Error creating scrolling text:', error);
    res.status(500).json({ error: 'Failed to create scrolling text' });
  }
});

// Route to update scrolling text by ID
router.put('/update-scrolling-text/:id', async (req, res) => {
  try {
    const { text, link } = req.body;
    const { id } = req.params;

    // Check if text is provided
    if (!text) {
      return res.status(400).json({ error: 'Scrolling text is required' });
    }

    // Find the scrolling text by ID
    let scrollingText = await ScrollingText.findById(id);

    if (!scrollingText) {
      return res.status(404).json({ error: 'Scrolling text not found' });
    }

    // Update the scrolling text document
    scrollingText.text = text;
    scrollingText.link = link || scrollingText.link; // Update link if provided

    // Save the updated document
    scrollingText = await scrollingText.save();

    // Send success response with updated text
    res.status(200).json({
      message: 'Scrolling text updated successfully',
      scrollingText,
    });
  } catch (error) {
    console.error('Error updating scrolling text:', error);
    res.status(500).json({ error: 'Failed to update scrolling text' });
  }
});

// Route to get the current scrolling text
router.get('/get-scrolling-text', async (req, res) => {
  try {
    const scrollingText = await ScrollingText.find();
    if (!scrollingText) {
      return res.status(404).json({ error: 'Scrolling text not found' });
    }
    res.status(200).json({
      message: 'Scrolling text fetched successfully',
      scrollingText,
    });
  } catch (error) {
    console.error('Error fetching scrolling text:', error);
    res.status(500).json({ error: 'Failed to fetch scrolling text' });
  }
});

// Route to delete scrolling text by ID
router.delete('/delete-scrolling-text/:id', async (req, res) => {
  try {
    // Find the scrolling text by ID
    const scrollingText = await ScrollingText.findById(req.params.id);

    if (!scrollingText) {
      return res.status(404).json({ error: 'Scrolling text not found' });
    }

    // Delete the scrolling text document
    await ScrollingText.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Scrolling text deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scrolling text:', error);
    res.status(500).json({ error: 'Failed to delete scrolling text' });
  }
});

// Route to get all scrolling texts (if more than one exists)
router.get('/all-scrolling-text', async (req, res) => {
  try {
    const scrollingTexts = await ScrollingText.find();
    res.status(200).json({
      message: 'All scrolling texts fetched successfully',
      scrollingTexts,
    });
  } catch (error) {
    console.error('Error fetching all scrolling texts:', error);
    res.status(500).json({ error: 'Failed to fetch all scrolling texts' });
  }
});



// Route to add a new upcoming exam
router.post('/add-upcoming-exam', async (req, res) => {
  try {
      const { examName, examDate, examLink } = req.body;

      // Create a new upcoming exam document
      const newExam = new UpcomingExam({ examName, examDate, examLink });

      await newExam.save();

      res.status(201).json({
          message: 'Upcoming exam added successfully',
          newExam,
      });
  } catch (error) {
      console.error('Error adding upcoming exam:', error);
      res.status(500).json({ error: 'Failed to add upcoming exam' });
  }
});


// Route to fetch all upcoming exams
router.get('/upcoming-exams', async (req, res) => {
  try {
      const exams = await UpcomingExam.find();
      res.status(200).json({
          message: 'Upcoming exams fetched successfully',
          exams,
      });
  } catch (error) {
      console.error('Error fetching upcoming exams:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming exams' });
  }
});

// Route to update an existing upcoming exam by ID
router.put('/update-upcoming-exam/:id', async (req, res) => {
  try {
      const { examName, examDate, examLink } = req.body;

      const updatedExam = await UpcomingExam.findByIdAndUpdate(
          req.params.id, 
          { examName, examDate, examLink },
          { new: true }  // Returns the updated document
      );

      if (!updatedExam) {
          return res.status(404).json({ error: 'Upcoming exam not found' });
      }

      res.status(200).json({
          message: 'Upcoming exam updated successfully',
          updatedExam,
      });
  } catch (error) {
      console.error('Error updating upcoming exam:', error);
      res.status(500).json({ error: 'Failed to update upcoming exam' });
  }
});

// Route to delete an upcoming exam by ID
router.delete('/delete-upcoming-exam/:id', async (req, res) => {
  try {
      const deletedExam = await UpcomingExam.findByIdAndDelete(req.params.id);

      if (!deletedExam) {
          return res.status(404).json({ error: 'Upcoming exam not found' });
      }

      res.status(200).json({
          message: 'Upcoming exam deleted successfully',
      });
  } catch (error) {
      console.error('Error deleting upcoming exam:', error);
      res.status(500).json({ error: 'Failed to delete upcoming exam' });
  }
});


// Route to add a new notification
router.post('/add-notification', async (req, res) => {
  try {
      const { notificationName, notificationDate, notificationLink } = req.body;

      // Create a new notification document
      const newNotification = new Notification({ notificationName, notificationDate, notificationLink });

      await newNotification.save();

      res.status(201).json({
          message: 'Notification added successfully',
          newNotification,
      });
  } catch (error) {
      console.error('Error adding notification:', error);
      res.status(500).json({ error: 'Failed to add notification' });
  }
});


// Route to fetch all notifications
router.get('/notifications', async (req, res) => {
  try {
      const notifications = await Notification.find();
      res.status(200).json({
          message: 'Notifications fetched successfully',
          notifications,
      });
  } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});


// Route to update an existing notification by ID
router.put('/update-notification/:id', async (req, res) => {
  try {
      const { notificationName, notificationDate, notificationLink } = req.body;

      const updatedNotification = await Notification.findByIdAndUpdate(
          req.params.id, 
          { notificationName, notificationDate, notificationLink },
          { new: true }  // Returns the updated document
      );

      if (!updatedNotification) {
          return res.status(404).json({ error: 'Notification not found' });
      }

      res.status(200).json({
          message: 'Notification updated successfully',
          updatedNotification,
      });
  } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ error: 'Failed to update notification' });
  }
});
// Route to delete a notification by ID
router.delete('/delete-notification/:id', async (req, res) => {
  try {
      const deletedNotification = await Notification.findByIdAndDelete(req.params.id);

      if (!deletedNotification) {
          return res.status(404).json({ error: 'Notification not found' });
      }

      res.status(200).json({
          message: 'Notification deleted successfully',
      });
  } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Route to add a new class
router.post('/add-class', upload.single('photo'), async (req, res) => {
  try {
      const { title, videolink } = req.body;
      let photoUrl = '';

      if (req.file) {
          const fileName = createFileName('class', req.file.originalname);
          const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: `classes/${fileName}`,
              Body: req.file.buffer,
              ContentType: req.file.mimetype,
          };

          // Upload to S3
          await s3.send(new PutObjectCommand(params));
          photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/classes/${fileName}`;
      }

      const newClass = new Class({
          title,
          videolink,
          photo: photoUrl,
      });

      await newClass.save();
      res.status(201).json({
          message: 'Class added successfully',
          newClass,
      });
  } catch (error) {
      console.error('Error adding class:', error);
      res.status(500).json({ error: 'Failed to add class' });
  }
});

// Route to fetch all classes
router.get('/classes', async (req, res) => {
  try {
      const classes = await Class.find();
      res.status(200).json({
          message: 'Classes fetched successfully',
          classes,
      });
  } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Route to update an existing class by ID
router.put('/update-class/:id', upload.single('photo'), async (req, res) => {
  try {
      const { title, videolink } = req.body;
      const updateData = { title, videolink };

      if (req.file) {
          // If a new image is uploaded, update the S3 URL
          const fileName = createFileName('class', req.file.originalname);
          const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: `classes/${fileName}`,
              Body: req.file.buffer,
              ContentType: req.file.mimetype,
          };

          // Upload to S3
          await s3.send(new PutObjectCommand(params));
          updateData.photo = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/classes/${fileName}`;
      }

      const updatedClass = await Class.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!updatedClass) {
          return res.status(404).json({ error: 'Class not found' });
      }

      res.status(200).json({
          message: 'Class updated successfully',
          updatedClass,
      });
  } catch (error) {
      console.error('Error updating class:', error);
      res.status(500).json({ error: 'Failed to update class' });
  }
});


// Route to delete a class by ID
router.delete('/delete-class/:id', async (req, res) => {
    try {
        const classToDelete = await Class.findById(req.params.id);
        if (!classToDelete) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // If there is an image, delete it from S3
        if (classToDelete.photo) {
            const s3Key = classToDelete.photo.split(`${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/classes/`)[1];
            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
            };

            await s3.send(new DeleteObjectCommand(deleteParams));
        }

        // Delete the class from MongoDB
        await Class.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: 'Class deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ error: 'Failed to delete class' });
    }
});


// Route to add student feedback
router.post('/add-feedback', upload.single('photo'), async (req, res) => {
  try {
      const { name, achievement, feedbackText } = req.body;
      let photoUrl = '';

      if (req.file) {
          const fileName = createFileName('feedback', req.file.originalname);
          const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: `feedbacks/${fileName}`,
              Body: req.file.buffer,
              ContentType: req.file.mimetype,
          };

          // Upload to S3
          await s3.send(new PutObjectCommand(params));
          photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/feedbacks/${fileName}`;
      }

      const newFeedback = new StudentFeedback({
          name,
          achievement,
          feedbackText,
          photo: photoUrl,
      });

      await newFeedback.save();
      res.status(201).json({
          message: 'Feedback added successfully',
          newFeedback,
      });
  } catch (error) {
      console.error('Error adding feedback:', error);
      res.status(500).json({ error: 'Failed to add feedback' });
  }
});
// Route to fetch all student feedback
router.get('/feedbacks', async (req, res) => {
  try {
      const feedbacks = await StudentFeedback.find();
      res.status(200).json({
          message: 'Feedbacks fetched successfully',
          feedbacks,
      });
  } catch (error) {
      console.error('Error fetching feedbacks:', error);
      res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});
// Route to update an existing student feedback by ID
router.put('/update-feedback/:id', upload.single('photo'), async (req, res) => {
  try {
      const { name, achievement, feedbackText } = req.body;
      const updateData = { name, achievement, feedbackText };

      if (req.file) {
          // If a new image is uploaded, update the S3 URL
          const fileName = createFileName('feedback', req.file.originalname);
          const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: `feedbacks/${fileName}`,
              Body: req.file.buffer,
              ContentType: req.file.mimetype,
          };

          // Upload to S3
          await s3.send(new PutObjectCommand(params));
          updateData.photo = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/feedbacks/${fileName}`;
      }

      const updatedFeedback = await StudentFeedback.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!updatedFeedback) {
          return res.status(404).json({ error: 'Feedback not found' });
      }

      res.status(200).json({
          message: 'Feedback updated successfully',
          updatedFeedback,
      });
  } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// Route to delete feedback by ID
router.delete('/delete-feedback/:id', async (req, res) => {
    try {
        const feedbackToDelete = await StudentFeedback.findById(req.params.id);
        if (!feedbackToDelete) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        // If there is a photo, delete it from S3
        if (feedbackToDelete.photo) {
            const s3Key = feedbackToDelete.photo.split(`${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/feedbacks/`)[1];
            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
            };

            await s3.send(new DeleteObjectCommand(deleteParams));
        }

        // Delete the feedback from MongoDB
        await StudentFeedback.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: 'Feedback deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ error: 'Failed to delete feedback' });
    }
});


// Update Stats (for all fields)
router.post('/update-stats', async (req, res) => {
  try {
      const { websiteViewers, noOfCentres, placements, alumni, courses, students, faculty } = req.body;

      // Find and update the stats, if no stats exist, a new one is created
      const stats = await InstitutionStats.findOneAndUpdate(
          {}, // Empty filter means update the first found document or create a new one
          { websiteViewers, noOfCentres, placements, alumni, courses, students, faculty },
          { new: true, upsert: true } // upsert creates a new record if none exists
      );

      // Send success response
      res.status(200).json({
          message: 'Institution stats updated successfully',
          stats,
      });
  } catch (error) {
      console.error('Error updating stats:', error);
      res.status(500).json({ error: 'Failed to update stats' });
  }
});


router.get('/stats', async (req, res) => {
  try {
    // Fetch the stats from the InstitutionStats collection
    const stats = await InstitutionStats.findOne({}); // Get the first (and only) document

    if (!stats) {
      return res.status(404).json({ message: 'Stats not found' });
    }

    // Send success response with the stats
    res.status(200).json({
      message: 'Stats fetched successfully',
      stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/all', async (req, res) => {
  try {
    // Fetch banner images
    const bannerImages = BannerImage.find({});

    // Fetch scrolling text
    const scrollingText = ScrollingText.find();

    // Fetch upcoming exams
    const upcomingExams = UpcomingExam.find();

    // Fetch notifications
    const notifications = Notification.find();

    // Fetch classes
    const classes = Class.find();

    // Fetch and update the 'Website viewers' stat
    const websiteViewersStat = await InstitutionStats.findOneAndUpdate(
      { id: 'Website viewers' },  // Find the document with id 'Website viewers'
      { $inc: { value: 0.5 } },     // Increment the 'value' field by 1 notw
      { new: true }               // Return the updated document
    );

    // Fetch all stats including the updated 'Website viewers' stat
    const allStats = InstitutionStats.find();  // Fetch all stats records

    // Fetch student feedback
    const feedbacks = StudentFeedback.find();

    const Services = Service.find();

    const Activities = PreparationActivity.find();
    const popups = await Popup.find();

    // Use Promise.all to execute all queries concurrently
    const [bannerImagesData, scrollingTextData, upcomingExamsData, notificationsData, classesData, allStatsData, feedbacksData, servicesData, activitiesData,popupsData] = await Promise.all([
      bannerImages,
      scrollingText,
      upcomingExams,
      notifications,
      classes,
      allStats,
      feedbacks,
      Services,
      Activities,
      popups
    ]);

    // Send a single response with all the data
    res.status(200).json({
      message: 'Homepage data fetched successfully',
      data: {
        bannerImages: bannerImagesData,
        scrollingText: scrollingTextData,
        upcomingExams: upcomingExamsData,
        notifications: notificationsData,
        classes: classesData,
        stats: allStatsData,  // Return all stats
        feedbacks: feedbacksData,
        Services: servicesData,
        Activities: activitiesData,
        popups:popupsData
      }
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.status(500).json({ error: 'Failed to fetch homepage data' });
  }
});



// Route to create a new service
router.post('/add-service', upload.single('logo'), async (req, res) => {
  try {
    const { title } = req.body;
    let logoUrl = '';

    if (req.file) {
      const fileName = `service-logo-${Date.now()}-${req.file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `services/${fileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      // Upload to S3
      await s3.send(new PutObjectCommand(params));
      logoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/services/${fileName}`;
    }

    const newService = new Service({
      title,
      logo: logoUrl,
    });

    await newService.save();
    res.status(201).json({
      message: 'Service added successfully',
      newService,
    });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// Route to get all services
router.get('/all-services', async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Route to update a service (with logo upload)
router.put('/update-service/:id', upload.single('logo'), async (req, res) => {
    const serviceId = req.params.id;
    const { title } = req.body;
    let logoUrl = '';
  
    try {
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
  
      // If a new logo is provided, handle the logo update
      if (req.file) {
        const fileName = createFileName('service', req.file.originalname);
        const fileStream = req.file.buffer;
  
        // Delete the old logo from S3 if it's being updated
        if (service.logo) {
          const oldLogoKey = service.logo.split('.amazonaws.com/')[1];
          const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldLogoKey,
          };
  
          // Delete old logo from S3
          await s3.send(new DeleteObjectCommand(deleteParams));
        }
  
        // Set the S3 upload parameters
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `services/${fileName}`,
          Body: fileStream,
          ContentType: req.file.mimetype,
        };
  
        // Use Upload class for better performance during file upload
        const upload = new Upload({
          client: s3,
          params: uploadParams,
          partSize: 5 * 1024 * 1024,  // 5 MB parts
          leavePartsOnError: false,
        });
  
        // Perform the upload
        await upload.done();
  
        // Generate the new logo URL
        logoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/services/${fileName}`;
      }
  
      // Update the service fields
      service.title = title || service.title;
      service.logo = logoUrl || service.logo;
  
      // Save the updated service
      await service.save();
      
      res.status(200).json({
        message: 'Service updated successfully',
        service,
      });
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ error: 'Failed to update service' });
    }
  });

// Route to delete a service
router.delete('/delete-service/:id', async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);
  
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
  
      // Delete logo from S3
      const logoKey = service.logo.split('.amazonaws.com/')[1];
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: logoKey,
      };
  
      // Use DeleteObjectCommand to remove the file from S3
      await s3.send(new DeleteObjectCommand(deleteParams));
  
      // Delete the service from the database
      await Service.findByIdAndDelete(req.params.id); // Correct way to delete document in Mongoose
  
      res.status(200).json({
        message: 'Service deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  });

// Route to add a new preparation activity
router.post('/add-activity', upload.single('logo'), async (req, res) => {
  try {
    const { title, content } = req.body;
    let logoUrl = '';

    if (req.file) {
      const fileName = createFileName('activity', req.file.originalname);
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `preparation-activities/${fileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      // Upload to S3
      await s3.send(new PutObjectCommand(params));
      logoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/preparation-activities/${fileName}`;
    }

    const newActivity = new PreparationActivity({
      title,
      content,
      logo: logoUrl,
    });

    await newActivity.save();
    res.status(201).json({
      message: 'Preparation Activity added successfully',
      newActivity,
    });
  } catch (error) {
    console.error('Error adding preparation activity:', error);
    res.status(500).json({ error: 'Failed to add preparation activity' });
  }
});

// Route to get all preparation activities
router.get('/activities/get-all', async (req, res) => {
  try {
    const activities = await PreparationActivity.find();
    res.status(200).json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Route to get a specific preparation activity by ID
router.get('/activities/get/:id', async (req, res) => {
  try {
    const activity = await PreparationActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.status(200).json({ activity });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Route to update a preparation activity (with logo upload)
router.put('/activities/update/:id', upload.single('logo'), async (req, res) => {
    const activityId = req.params.id;
    const { title, content } = req.body;
    let logoUrl = '';
  
    try {
      const activity = await PreparationActivity.findById(activityId);
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
  
      // If a new logo is provided, handle the logo update
      if (req.file) {
        const fileName = createFileName('activity', req.file.originalname);
        const fileStream = req.file.buffer;
  
        // Delete the old logo from S3 if it's being updated
        if (activity.logo) {
          const oldLogoKey = activity.logo.split('.amazonaws.com/')[1];
          const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldLogoKey,
          };
  
          // Delete old logo from S3
          await s3.send(new DeleteObjectCommand(deleteParams));
        }
  
        // Set the S3 upload parameters
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `preparation-activities/${fileName}`,
          Body: fileStream,
          ContentType: req.file.mimetype,
        };
  
        // Use the Upload class for better performance during file upload
        const upload = new Upload({
          client: s3,
          params: uploadParams,
          partSize: 5 * 1024 * 1024,  // 5 MB parts
          leavePartsOnError: false,
        });
  
        // Perform the upload
        await upload.done();
  
        // Generate the new logo URL
        logoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/preparation-activities/${fileName}`;
      }
  
      // Update the preparation activity fields
      activity.title = title || activity.title;
      activity.content = content || activity.content;
      activity.logo = logoUrl || activity.logo;
  
      // Save the updated activity
      await activity.save();
  
      res.status(200).json({
        message: 'Preparation activity updated successfully',
        activity,
      });
    } catch (error) {
      console.error('Error updating preparation activity:', error);
      res.status(500).json({ error: 'Failed to update preparation activity' });
    }
  });
  
// Route to delete a preparation activity
// Route to delete a preparation activity
router.delete('/activities/delete/:id', async (req, res) => {
    try {
      const activity = await PreparationActivity.findById(req.params.id);
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
  
      // Delete logo from S3 if it exists
      const logoKey = activity.logo.split('.amazonaws.com/')[1];
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: logoKey,
      };
      await s3.send(new PutObjectCommand(deleteParams));
  
      // Use findByIdAndDelete instead of remove
      await PreparationActivity.findByIdAndDelete(req.params.id);
  
      res.status(200).json({
        message: 'Preparation Activity deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting preparation activity:', error);
      res.status(500).json({ error: 'Failed to delete preparation activity' });
    }
  });
  

  router.post('/add-stat', upload.single('logo'), async (req, res) => {
    try {
      const { id, value } = req.body;
  
      if (!id || !value) {
        return res.status(400).json({ error: 'ID and value are required' });
      }
  
      let logoUrl = '';
      if (req.file) {
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `stats/${fileName}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };
  
        // Upload to S3
        await s3.send(new PutObjectCommand(uploadParams));
  
        logoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/stats/${fileName}`;
      }
  
      const newStat = new InstitutionStats({
        id,
        value,
        logo: logoUrl,
      });
  
      await newStat.save();
      res.status(201).json({
        message: 'Stat added successfully',
        stat: newStat,
      });
    } catch (error) {
      console.error('Error adding stat:', error);
      res.status(500).json({ error: 'Failed to add stat' });
    }
  });
  router.get('/get-stats', async (req, res) => {
    try {
      // Fetch all stats from the collection
      const stats = await InstitutionStats.find();
  
      if (!stats || stats.length === 0) {
        return res.status(404).json({ error: 'No stats found' });
      }
  
      res.status(200).json({
        message: 'Stats fetched successfully',
        stats,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });
  
  
  router.put('/update-stat/:id', upload.single('logo'), async (req, res) => {
    try {
      const { id } = req.params;
      const { value } = req.body;
  
      console.log('Request received to update stat with ID:', id);
      console.log('New value:', value);
  
      const stat = await InstitutionStats.findOne({ id });
  
      if (!stat) {
        console.log('Stat not found for ID:', id);
        return res.status(404).json({ error: 'Stat not found' });
      }
  
      let logoUrl = stat.logo;
      if (req.file) {
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `stats/${fileName}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };
  
        // Upload new logo to S3
        await s3.send(new PutObjectCommand(uploadParams));
  
        logoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/stats/${fileName}`;
      }
  
      // Update the stat fields
      stat.value = value || stat.value;
      stat.logo = logoUrl;
  
      await stat.save();
      res.status(200).json({
        message: 'Stat updated successfully',
        stat,
      });
    } catch (error) {
      console.error('Error updating stat:', error);
      res.status(500).json({ error: 'Failed to update stat' });
    }
  });
  
  router.delete('/delete-stat/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      const stat = await InstitutionStats.findOneAndDelete({ id });
      if (!stat) {
        return res.status(404).json({ error: 'Stat not found' });
      }
  
      res.status(200).json({
        message: 'Stat deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting stat:', error);
      res.status(500).json({ error: 'Failed to delete stat' });
    }
  });
  
module.exports = router;
