const Booking = require('../models/Booking');
const Service = require('../models/Service');
const nodemailer = require('nodemailer');
// Helper: generate 4-digit OTP
const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

// @desc    Log a new booking interaction (Call/WhatsApp)
// @route   POST /api/bookings
// @access  Private/User
const createBooking = async (req, res) => {
  try {
    const { serviceId, interactionType } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const booking = new Booking({
      customer: req.user._id,
      provider: service.provider,
      service: service._id,
      interactionType,
      status: 'contacted'
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error creating booking' });
  }
};

// @desc    Get logged in user's booking history
// @route   GET /api/bookings/my-history
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'provider') {
      query.provider = req.user._id;
    } else {
      query.customer = req.user._id;
    }

    const bookings = await Booking.find(query)
      .populate('provider', 'name email')
      .populate('customer', 'name email mobileNumber')
      .populate('service', 'serviceName serviceType location serviceCharges mobileNumber')
      .sort({ createdAt: -1 });

    // SECURITY: Only return the completionOtp to the customer. 
    // The provider should NOT see it on their screen (they must ask the customer).
    const sanitizedBookings = bookings.map(b => {
      const bookingObj = b.toObject();
      if (req.user.role === 'provider') {
        delete bookingObj.completionOtp;
      }
      return bookingObj;
    });

    res.json(sanitizedBookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching booking history' });
  }
};

// @desc    Provider requests job completion — generates OTP & sends to customer via WhatsApp
// @route   POST /api/bookings/:id/request-complete
// @access  Private/Provider
const requestCompletion = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email mobileNumber')
      .populate('service', 'serviceName mobileNumber');  // mobileNumber = provider's contact

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Booking is already completed' });
    }

    // Generate OTP (expires in 30 minutes)
    const otp = generateOtp();
    const expiry = new Date(Date.now() + 30 * 60 * 1000);

    booking.status = 'completion_requested';
    booking.completionOtp = otp;
    booking.otpExpiry = expiry;
    await booking.save();

    const customer = booking.customer;
    const providerName = req.user.name;
    const serviceName = booking.service?.serviceName || 'Service';

    // Construct the notification text
    const emailSubject = `Work Completion OTP for ${serviceName}`;
    const emailText = `Hello ${customer.name},\n\nYour service provider ${providerName} has requested to complete your booking for "${serviceName}".\n\nYour Work Completion OTP is: ${otp}\n\nPlease share this OTP with the provider only if the work has been completed to your satisfaction.\n\nThank you,\nSmart Local Service Finder Team`;

    // 1. Send via Email (Fire-and-forget in background to prevent hanging)
    try {
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
      console.log(`[Completion OTP] Attempting email to ${customer.email} via ${smtpHost}:${smtpPort}`);
      
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false
        }
      });

      const htmlBody = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f0f4ff;padding:32px 16px;border-radius:20px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:28px;font-weight:900;color:#3b6cf4">Smart<span style="color:#7c3aed">Local</span> ⚡</span>
          </div>
          <div style="background:white;border-radius:16px;padding:32px;border:1px solid rgba(59,108,244,0.12)">
            <p style="font-size:16px;color:#0f172a;margin:0 0 8px">Hi <strong>${customer.name}</strong>,</p>
            <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px">
              Your service provider <strong>${providerName}</strong> has completed the work for
              <strong>"${serviceName}"</strong> and is requesting your confirmation.<br>
              Share the code below <strong>only if</strong> you are satisfied with the work.
            </p>
            <div style="text-align:center;margin:0 0 28px">
              <div style="display:inline-block;background:linear-gradient(135deg,#3b6cf4,#7c3aed);border-radius:14px;padding:20px 40px">
                <span style="font-size:40px;font-weight:900;color:white;letter-spacing:10px;font-family:monospace">${otp}</span>
              </div>
              <p style="color:#94a3b8;font-size:12px;margin:12px 0 0">⏱ This code expires in <strong>30 minutes</strong>. Do not share it until you're satisfied.</p>
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
              If you didn't request this service, please contact our support team.
            </p>
          </div>
        </div>
      `;

      // Do NOT await, so the request doesn't hang if SMTP is slow/blocked
      transporter.sendMail({
        from: `"SmartLocal ⚡" <${process.env.EMAIL_USER}>`,
        to: customer.email,
        subject: emailSubject,
        text: emailText,
        html: htmlBody,
      })
      .then(() => console.log(`[Completion OTP] ✅ Email sent successfully to ${customer.email}`))
      .catch(emailErr => console.error(`[Completion OTP] ❌ Email FAILED to ${customer.email}:`, emailErr.message, emailErr.code));
      
    } catch (emailErr) {
      console.error('[Completion OTP] ❌ Error configuring email transport:', emailErr.message);
    }

    // Real-time: notify the customer's socket room
    if (booking.customer) {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${booking.customer._id}`).emit('completion_requested', {
          bookingId: booking._id,
          serviceName: booking.service?.serviceName || 'Service',
          message: 'Job completion requested! We have sent the OTP to your email. Please share it with the provider if satisfied.',
        });
      }
    }

    res.json({
      message: 'OTP generated! Ask the customer for the code sent to their email.',
      bookingId: booking._id,
      customerName: booking.customer?.name || 'Customer',
      serviceName: booking.service?.serviceName || 'Service',
      providerName: req.user?.name || 'Provider',
      expiresIn: '30 minutes',
    });
  } catch (error) {
    console.error('Error in requestCompletion:', error);
    res.status(500).json({ message: error.message || 'Server error requesting completion' });
  }
};

// @desc    Provider enters OTP received from customer to confirm completion
// @route   PUT /api/bookings/:id/complete
// @access  Private/Provider
const markBookingCompleted = async (req, res) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('service', 'serviceName');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only the PROVIDER of this booking can verify with OTP
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to verify this booking' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Booking is already completed' });
    }

    if (booking.status !== 'completion_requested') {
      return res.status(400).json({ message: 'You need to request completion first.' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'Please enter the OTP shared by the customer.' });
    }

    if (booking.completionOtp !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP. Please ask the customer for the correct code.' });
    }

    if (booking.otpExpiry && new Date() > booking.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired. Please request completion again.' });
    }

    // Mark completed and clear OTP
    booking.status = 'completed';
    booking.completionOtp = null;
    booking.otpExpiry = null;
    const updatedBooking = await booking.save();

    // Real-time: notify BOTH customer and provider rooms
    const io = req.app.get('io');
    if (io) {
      const payload = {
        bookingId: booking._id,
        serviceName: booking.service?.serviceName,
        customerName: booking.customer?.name,
      };
      io.to(`user_${booking.customer._id}`).emit('booking_completed', payload);
      io.to(`user_${req.user._id}`).emit('booking_completed', payload);
    }

    res.json({
      message: 'Job verified and marked as completed! The customer can now leave a review.',
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error completing booking' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  requestCompletion,
  markBookingCompleted,
};
