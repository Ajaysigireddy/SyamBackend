const express = require('express');
const { connectToMongoDB, s3 } = require('./config/db');
const contactFormRoutes=require('./routes/contactFormroutes');
const examcalender=require('./routes/ExamCalenderRoutes');
const homepage=require('./routes/HompageRoutes')
const chairmanMessage=require('./routes/chairmanMessageRoutes')
const missionandvision=require('./routes/MissionAndVisionRoutes')
const examresult=require('./routes/examResultsRoutes')
const faq=require('./routes/faqRoutes')
const batches=require('./routes/upcomingBatchesRoutes')
const successstories=require('./routes/successStoriesRoutes')
const user=require('./routes/userRoutes')
const questionpapers=require('./routes/questionPaperRoutes')
const methodology=require('./routes/methodologyRoutes')
const course=require('./routes/courseRoutes')
const portfolio=require('./routes/portfolioRoutes')
const banner = require('./routes/bannerImageRoutes')
const popups = require('./routes/popupRoutes')
const material =  require('./routes/materialRoutes')
const hallticket=require('./routes/hallticketRoutes')
const centreRoutes=require('./routes/centerRoutes')
require('dotenv').config();  // To load environment variables

const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Connect to MongoDB
connectToMongoDB();

app.use('/contact',contactFormRoutes);
app.use('/faqs',faq);
app.use('/examcalender',examcalender);
app.use('/examresult',examresult);
app.use('/homepage',homepage);
app.use('/chairmanmessage',chairmanMessage);
app.use('/mission-vision',missionandvision);
app.use('/batches',batches);
app.use('/success-stories',successstories);
app.use('/user',user);
app.use('/pqna',questionpapers);
app.use('/methodology',methodology);
app.use('/course',course);
app.use('/portfolio',portfolio);
app.use('/banner',banner);
app.use('/popups',popups);
app.use('/material',material);
app.use('/hallticket',hallticket)
app.use('/centre',centreRoutes)




// Route
app.get('/', (req, res) => {
  res.send('Backend server is running......');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
