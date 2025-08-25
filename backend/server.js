const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const Appointment = require('./models/Appointment');

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.log('MongoDB Connection Error:', err);
    process.exit(1); // Exit if cannot connect to database
  });

// ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/appointments', require('./routes/appointments'));
// Add other routes as needed

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Auto-cancel pending appointments older than 24 hours
const AUTO_CANCEL_INTERVAL_MS = 60 * 60 * 1000; // run hourly
async function autoCancelStaleAppointments() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Appointment.updateMany(
      { status: 'pending', createdAt: { $lt: cutoff } },
      { $set: { status: 'cancelled', cancelledAt: new Date() } }
    );
    if (result.modifiedCount) {
      console.log(`Auto-cancelled ${result.modifiedCount} stale pending appointments`);
    }
  } catch (err) {
    console.error('Auto-cancel job error:', err);
  }
}
setInterval(autoCancelStaleAppointments, AUTO_CANCEL_INTERVAL_MS);
// Also run once on startup after small delay to avoid start-up race
setTimeout(autoCancelStaleAppointments, 15 * 1000);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 