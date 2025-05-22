const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.VITE_EMAIL_USER,
    pass: process.env.VITE_EMAIL_PASSWORD
  }
});

app.post('/api/send-email', async (req, res) => {
  const {
    to,
    clinicName,
    clinicEmail,
    patientName,
    appointmentDate,
    appointmentTime,
    reason,
    notes
  } = req.body;

  try {
    // Email to clinic
    const clinicMailOptions = {
      from: process.env.VITE_EMAIL_USER,
      to: clinicEmail,
      subject: `New Appointment Request from ${patientName}`,
      html: `
        <h2>New Appointment Request</h2>
        <p><strong>Patient Name:</strong> ${patientName}</p>
        <p><strong>Date:</strong> ${appointmentDate}</p>
        <p><strong>Time:</strong> ${appointmentTime}</p>
        <p><strong>Reason for Visit:</strong> ${reason}</p>
        ${notes ? `<p><strong>Additional Notes:</strong> ${notes}</p>` : ''}
      `
    };

    // Email to patient
    const patientMailOptions = {
      from: process.env.VITE_EMAIL_USER,
      to: to,
      subject: `Appointment Request Confirmation - ${clinicName}`,
      html: `
        <h2>Appointment Request Confirmation</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment request has been sent to ${clinicName}.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Date: ${appointmentDate}</li>
          <li>Time: ${appointmentTime}</li>
          <li>Reason: ${reason}</li>
        </ul>
        <p>You will receive a confirmation email once the clinic approves your appointment.</p>
      `
    };

    // Send both emails
    await transporter.sendMail(clinicMailOptions);
    await transporter.sendMail(patientMailOptions);

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 