const express = require('express');
const Counter = require('../models/counter');
const HallTicket = require('../models/hallTicket');
const nodemailer = require('nodemailer');
const router = express.Router();
require('dotenv').config();
const pdf = require('html-pdf');
// Helper function to get the next sequence value
const getNextSequence = async (counterName) => {
    const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true }
    );
    return counter.sequenceValue;
};

// Create the nodemailer transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service (e.g., Gmail, SendGrid, etc.)
    auth: {
        user: process.env.EMAIL_ID, // Replace with your email
        pass: process.env.PASSWORD // Replace with your email password or app-specific password
    }
});

const sendEmail = (email, hallTicket) => {
    const mailOptions = {
        from: 'demosyam1234@gmail.com',
        to: email,
        secure: true, 
        subject: 'Your Hall Ticket Information',
        html: `
 <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f9;
                        margin: 0;
                        padding: 0;
                        color: #333;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background-color: #3b9dd3;
                        color: #ffffff;
                        padding: 20px;
                        text-align: center;
                        border-radius: 8px;
                    }
                    .content {
                        padding: 20px;
                        font-size: 16px;
                    }
                    .content h3 {
                        color: #333;
                        font-size: 24px;
                    }
                    .content p {
                        color: #666;
                        font-size: 16px;
                    }
                    .footer {
                        background-color: #f1f1f1;
                        color: #666;
                        padding: 10px;
                        text-align: center;
                        border-radius: 0 0 8px 8px;
                        font-size: 12px;
                    }
                    .highlight {
                        color: #3b9dd3;
                        font-weight: bold;
                    }
                    .btn {
                        background-color: #3b9dd3;
                        color: #ffffff;
                        padding: 12px 20px;
                        text-decoration: none;
                        border-radius: 5px;
                        text-align: center;
                        display: inline-block;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Welcome to Your Hall Ticket</h2>
                    </div>
                    <div class="content">
                        <h3>Dear <span class="highlight">${hallTicket.name}</span>,</h3>
                        <p>We are pleased to inform you that your hall ticket for the upcoming exam subscription has been successfully generated. Below are the details:</p>

                        <table style="width: 100%; margin-top: 20px;">
                            <tr>
                                <td><strong>Name:</strong></td>
                                <td>${hallTicket.name}</td>
                            </tr>
                            <tr>
                                <td><strong>Father's Name:</strong></td>
                                <td>${hallTicket.fatherName}</td>
                            </tr>
                            <tr>
                                <td><strong>Date of Birth:</strong></td>
                                <td>${hallTicket.dob}</td>
                            </tr>
                            <tr>
                                <td><strong>Hall Ticket No:</strong></td>
                                <td>${hallTicket.hallTicketNumber}</td>
                            </tr>
                            <tr>
                                <td><strong>Mobile:</strong></td>
                                <td>${hallTicket.mobile}</td>
                            </tr>
                            <tr>
                                <td><strong>Email:</strong></td>
                                <td>${hallTicket.email}</td>
                            </tr>
                            <tr>
                                <td><strong>Mother's Name:</strong></td>
                                <td>${hallTicket.motherName}</td>
                            </tr>
                            <tr>
                                <td><strong>Community:</strong></td>
                                <td>${hallTicket.community}</td>
                            </tr>
                            <tr>
                                <td><strong>Aadhar No:</strong></td>
                                <td>${hallTicket.aadharNo}</td>
                            </tr>
                            <tr>
                                <td><strong>Parent No:</strong></td>
                                <td>${hallTicket.parentNo}</td>
                            </tr>
                            <tr>
                                <td><strong>Gender:</strong></td>
                                <td>${hallTicket.gender}</td>
                            </tr>
                            <tr>
                                <td><strong>District:</strong></td>
                                <td>${hallTicket.district}</td>
                            </tr>
                            <tr>
                                <td><strong>Subscription Start Date:</strong></td>
                                <td>${hallTicket.subscriptionStartDate.toISOString().split('T')[0]}</td>
                            </tr>
                            <tr>
                                <td><strong>Expiry Date:</strong></td>
                                <td>${hallTicket.expiryDate.toISOString().split('T')[0]}</td>
                            </tr>
                        </table>
 <p>You can <a href="https://syam-backend-6x988ux86-ajaysigireddys-projects.vercel.app/hallticket/downloadHallTicket/${hallTicket.hallTicketNumber}" class="btn">Download your Hall Ticket</a>
for printout.</p>
                        <p>For any further assistance, feel free to contact us.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 Your Company. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};



// Route: Generate a Hall Ticket
router.post('/generateHallTicket', async (req, res) => {
    try {
        const {
            name,
            fatherName,
            dob,
            sscHallTicketNo,
            mobile,
            email,
            motherName,
            community,
            aadharNo,
            parentNo,
            gender,
            district,
            monthsSelected,
            isPaymentDone
        } = req.body;

        // Check payment status
        if (!isPaymentDone) {
            return res.status(400).json({ message: 'Payment required to generate hall ticket.' });
        }

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const date = String(currentDate.getDate()).padStart(2, '0');
        const districtCode = district.slice(0, 2).toUpperCase() + district.slice(-2).toUpperCase();

        const sequenceNumber = await getNextSequence('hallTicketNumber');
        const hallTicketNumber = `${year}${month}${date}${districtCode}${String(sequenceNumber).padStart(4, '0')}`;

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + parseInt(monthsSelected, 10));

        const hallTicket = new HallTicket({
            name,
            fatherName,
            dob,
            sscHallTicketNo,
            mobile,
            email,
            motherName,
            community,
            aadharNo,
            parentNo,
            gender,
            district,
            hallTicketNumber,
            subscriptionStartDate: currentDate, // Add subscription start date
            expiryDate
        });

        await hallTicket.save();

        // Send email with the hall ticket details
        sendEmail(email, hallTicket);

        res.status(201).json({ message: 'Hall ticket generated and sent to email', hallTicket });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate hall ticket', details: error.message });
    }
});


// Route: Check if a Hall Ticket is Expired
router.post('/checkExpiry', async (req, res) => {
    try {
        const { hallTicketNumber } = req.body; // Get hallTicketNumber from request body

        if (!hallTicketNumber) {
            return res.status(400).json({ error: 'Hall ticket number is required' });
        }

        const hallTicket = await HallTicket.findOne({ hallTicketNumber });

        if (!hallTicket) {
            return res.status(404).json({ error: 'Hall ticket not found' });
        }

        const currentDate = new Date();
        const isExpired = currentDate > hallTicket.expiryDate;

        res.status(200).json({
            hallTicketNumber: hallTicket.hallTicketNumber,
            expiryDate: hallTicket.expiryDate.toISOString().split('T')[0],
            isExpired
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check expiry', details: error.message });
    }
});






// Change this route to match the link in the email
router.get('/downloadHallTicket/:hallTicketNumber', async (req, res) => {
    const hallTicketNumber = req.params.hallTicketNumber;

    try {
        // Find hall ticket by number
        const hallTicket = await HallTicket.findOne({ hallTicketNumber });

        if (!hallTicket) {
            return res.status(404).json({ message: 'Hall Ticket not found' });
        }

        const htmlContent = `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f9;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #3b9dd3;
                    color: #ffffff;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table, th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                }
                .footer {
                    background-color: #f1f1f1;
                    color: #666;
                    padding: 10px;
                    text-align: center;
                    border-radius: 0 0 8px 8px;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Hall Ticket</h2>
                </div>
                <table>
                    <tr>
                        <th>Field</th>
                        <th>Details</th>
                    </tr>
                    <tr>
                        <td>Name</td>
                        <td>${hallTicket.name}</td>
                    </tr>
                    <tr>
                        <td>Father's Name</td>
                        <td>${hallTicket.fatherName}</td>
                    </tr>
                    <tr>
                        <td>Date of Birth</td>
                        <td>${hallTicket.dob}</td>
                    </tr>
                    <tr>
                        <td>Hall Ticket No</td>
                        <td>${hallTicket.hallTicketNumber}</td>
                    </tr>
                    <tr>
                        <td>Mobile</td>
                        <td>${hallTicket.mobile}</td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td>${hallTicket.email}</td>
                    </tr>
                    <tr>
                        <td>Mother's Name</td>
                        <td>${hallTicket.motherName}</td>
                    </tr>
                    <tr>
                        <td>Community</td>
                        <td>${hallTicket.community}</td>
                    </tr>
                    <tr>
                        <td>Aadhar No</td>
                        <td>${hallTicket.aadharNo}</td>
                    </tr>
                    <tr>
                        <td>Parent No</td>
                        <td>${hallTicket.parentNo}</td>
                    </tr>
                    <tr>
                        <td>Gender</td>
                        <td>${hallTicket.gender}</td>
                    </tr>
                    <tr>
                        <td>District</td>
                        <td>${hallTicket.district}</td>
                    </tr>
                    <tr>
                        <td>Subscription Start Date</td>
                        <td>${hallTicket.subscriptionStartDate.toISOString().split('T')[0]}</td>
                    </tr>
                    <tr>
                        <td>Expiry Date</td>
                        <td>${hallTicket.expiryDate.toISOString().split('T')[0]}</td>
                    </tr>
                </table>
                <div class="footer">
                    <p>&copy; 2024 Your Company. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        // Generate the PDF
        pdf.create(htmlContent).toBuffer((err, buffer) => {
            if (err) {
                return res.status(500).json({ message: 'Error generating PDF' });
            }

            // Set headers to prompt the user to download the PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${hallTicket.hallTicketNumber}_hall_ticket.pdf`);
            res.send(buffer);  // Send the PDF file to the client
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating hall ticket', error: error.message });
    }
});

module.exports = router;
