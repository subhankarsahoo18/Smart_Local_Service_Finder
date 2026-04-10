const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  requestCompletion,
  markBookingCompleted,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createBooking);
router.route('/my-history').get(protect, getMyBookings);

// Provider requests completion → generates OTP & sends to customer WhatsApp
router.route('/:id/request-complete').post(protect, requestCompletion);

// Provider enters customer's OTP to confirm completion
router.route('/:id/complete').put(protect, markBookingCompleted);

module.exports = router;
