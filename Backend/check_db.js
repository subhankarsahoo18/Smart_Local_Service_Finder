const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Service = require('./models/Service');

dotenv.config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const bookings = await Booking.find().limit(5);
    console.log('Recent Bookings IDs:', bookings.map(b => b._id));
    
    const count = await Booking.countDocuments();
    console.log('Total Bookings:', count);

    process.exit(0);
  } catch (err) {
    console.error('DB Check Error:', err);
    process.exit(1);
  }
};

checkDB();
