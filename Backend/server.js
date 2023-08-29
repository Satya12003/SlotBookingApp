const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5012;

// MongoDB connection
mongoose.connect('mongodb+srv://satya:satya@cluster0.a5yqzjv.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Schema and Model
const appointmentSchema = new mongoose.Schema({
  date: String,
  time: String,
  isBooked: Boolean,
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// API Routes
app.get('/api/bookings', async (req, res) => {
  try {
    const cursor = await db.collection('bookings').find({});
    const bookingsArray = await cursor.toArray();
    const bookings = {};
    bookingsArray.forEach((booking) => {
      bookings[booking.date] = booking.updatedSlot;
    });
      
   //   console.log(bookings);

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/book', async (req, res) => {
    const { date, updatedSlot } = req.body;
  await db.collection('bookings').insertOne({ date, updatedSlot });
  res.json({ message: 'Booking successful' });
});

app.put('/api/cancel/:date/:time', async (req, res) => {
  try {
    console.log("Received PUT request for date:", req.params.date, "and time:", req.params.time);  // Debugging line

    const { date, time } = req.params;
    const filter = { "date": date, "updatedSlot.time": time };
    const update = { $set: { "updatedSlot.isBooked": false } };

    const result = await db.collection('bookings').updateOne(filter, update);

    console.log("Update result:", result);  // Debugging line

    if (result.matchedCount === 1) {
      res.status(200).json({ message: 'Booking cancelled successfully' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error('Error canceling booking:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.toString() });
  }
});




app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
