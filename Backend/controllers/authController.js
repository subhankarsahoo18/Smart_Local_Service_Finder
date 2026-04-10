const User = require('../models/User');
const Service = require('../models/Service');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// ── OTP Email Sender ────────────────────────────────────────────────────────────
const sendOtpEmail = async (email, name, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"SmartLocal ⚡" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your SmartLocal Sign-In Verification Code',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f0f4ff;padding:32px 16px;border-radius:20px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:28px;font-weight:900;color:#3b6cf4">Smart<span style="color:#7c3aed">Local</span> ⚡</span>
        </div>
        <div style="background:white;border-radius:16px;padding:32px;border:1px solid rgba(59,108,244,0.12)">
          <p style="font-size:16px;color:#0f172a;margin:0 0 8px">Hi <strong>${name}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px">
            We received a Google sign-in request for your SmartLocal account.<br>
            Use the verification code below to complete your sign-in.
          </p>
          <div style="text-align:center;margin:0 0 28px">
            <div style="display:inline-block;background:linear-gradient(135deg,#3b6cf4,#7c3aed);border-radius:14px;padding:20px 40px">
              <span style="font-size:40px;font-weight:900;color:white;letter-spacing:10px;font-family:monospace">${otp}</span>
            </div>
            <p style="color:#94a3b8;font-size:12px;margin:12px 0 0">⏱ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
            If you didn't request this, you can safely ignore this email. Your account is secure.
          </p>
        </div>
      </div>
    `,
  });
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Nodemailer transporter (Gmail SMTP)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// @desc    Send OTP to email for registration verification
// @route   POST /api/auth/send-register-otp
// @access  Public
const sendRegisterOtp = async (req, res) => {
  try {
    const { email, name, mobileNumber } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Clear existing OTPs for this email to prevent spam issues
    await Otp.deleteMany({ email });
    
    await Otp.create({ email, otp });
    // Send Email OTP
    await sendOtpEmail(email, name || 'Future User', otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Register a new user or provider
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      name, email, password, role, otp,
      mobileNumber,
      serviceName, serviceType, location, serviceCharges,
      description, latitude, longitude,
    } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required for registration' });
    }

    if (!mobileNumber || mobileNumber.length !== 10) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number.' });
    }

    const otpRecord = await Otp.findOne({ email, otp: otp.trim() });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const resolvedRole = role || 'user';

    const userPayload = { name, email, password, role: resolvedRole, mobileNumber };


    const user = await User.create(userPayload);

    if (user) {
      let createdServiceId = null;
      if (user.role === 'provider') {
        try {
          const servicePayload = {
            provider: user._id,
            providerName: user.name,
            serviceName, serviceType, location,
            serviceCharges,
            mobileNumber: req.body.mobileNumber,
            description,
          };
          if (latitude && longitude) {
            servicePayload.locationCoordinates = {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            };
          }
          const svc = await Service.create(servicePayload);
          createdServiceId = svc._id;
        } catch (serviceError) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({ message: serviceError.message || 'Invalid service details' });
        }
      }

      // Clear OTP
      await Otp.deleteMany({ email });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobileNumber: user.mobileNumber || null,
        token: generateToken(user._id),
        serviceId: createdServiceId,
        hasPassword: !!user.password || true,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.googleId && !user.password) {
      return res.status(401).json({ message: 'This account was registered with Google. Please use Google Sign-In.' });
    }

    if (user && (await user.matchPassword(password))) {
      // If user originally signed up via Google, require OTP for manual login
      if (user.googleId) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();
        await sendOtpEmail(user.email, user.name, otp);

        return res.json({
          requiresOtp: true,
          userId: user._id,
          email: user.email,
          name: user.name,
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobileNumber: user.mobileNumber || null,
        token: generateToken(user._id),
        hasPassword: true,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Google OAuth sign-in/sign-up
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential missing' });

    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('your_google')) {
      return res.status(500).json({ message: 'Google Sign-In is not configured. Add GOOGLE_CLIENT_ID to .env' });
    }

    const { OAuth2Client } = require('google-auth-library');
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    if (!email) return res.status(400).json({ message: 'Could not get email from Google account' });
    let user = await User.findOne({ $or: [{ email }, { googleId }] }).select('+password');
    let isNewUser = false;

    if (user) {
      // Link Google ID if user registered manually
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Brand-new Google user — create and log in directly (no OTP)
      isNewUser = true;
      user = await User.create({ name, email, googleId, role: 'user' });
    }

    // ── New users: direct login ──
    if (isNewUser) {
      return res.json({
        _id: user._id, name: user.name, email: user.email,
        role: user.role, mobileNumber: user.mobileNumber || null,
        token: generateToken(user._id),
        isGoogleUser: true, googleId: user.googleId,
        hasPassword: !!user.password,
      });
    }

    // ── Existing users: send OTP for extra security ──
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();
    await sendOtpEmail(user.email, user.name, otp);

    return res.json({
      requiresOtp: true,
      userId: user._id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    res.status(401).json({ message: 'Google authentication failed. Please try again.' });
  }
};

// @desc    Verify OTP for Google sign-in
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyGoogleOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'userId and otp are required' });

    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }
    if (new Date() > user.otpExpire) {
      user.otp = null; user.otpExpire = null;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (user.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // Clear OTP and log the user in
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, mobileNumber: user.mobileNumber || null,
      token: generateToken(user._id),
      isGoogleUser: true, googleId: user.googleId,
      hasPassword: !!user.password,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Resend OTP for Google sign-in
// @route   POST /api/auth/resend-otp
// @access  Public
const resendGoogleOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOtpEmail(user.email, user.name, otp);

    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};


// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address' });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. You cannot reset a password for it.' });
    }

    // Generate reset token (signed JWT, 15 min expiry)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET + user.password, {
      expiresIn: '15m',
    });

    // Build reset URL (frontend URL)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${user._id}/${resetToken}`;

    // Send email
    const transporter = createTransporter();
    const mailOptions = {
      from: `"SmartLocal" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request - SmartLocal',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #f8faff; border-radius: 16px; overflow: hidden; border: 1px solid #e2eaff;">
          <div style="background: linear-gradient(135deg, #3b6cf4, #7c3aed); padding: 32px 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">⚡ SmartLocal</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Smart Local Service Finder</p>
          </div>
          <div style="padding: 36px 40px;">
            <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 12px;">Reset Your Password</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Hi <strong>${user.name}</strong>,<br/><br/>
              We received a request to reset your SmartLocal password. Click the button below to create a new password. This link is valid for <strong>15 minutes</strong>.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b6cf4, #2550d0); color: white; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(59,108,244,0.35);">
                Reset Password
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
              If you didn't request this, you can safely ignore this email. Your password won't change.<br/><br/>
              Or copy this link if the button doesn't work:<br/>
              <span style="color: #3b6cf4; word-break: break-all; font-size: 12px;">${resetUrl}</span>
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 16px 40px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2025 SmartLocal. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset link sent to your email address' });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
  }
};

// @desc    Reset password via token (from email link)
// @route   POST /api/auth/reset-password/:id/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Invalid reset link' });
    }

    // Verify token using user's current password hash as secret (invalidates after password change)
    try {
      jwt.verify(token, process.env.JWT_SECRET + user.password);
    } catch (err) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
      });
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successful. You can now sign in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Google Auth via access_token profile data (used with useGoogleLogin hook)
// @route   POST /api/auth/google-token
// @access  Public
const googleAuthToken = async (req, res) => {
  try {
    const { googleId, email, name } = req.body;
    if (!googleId || !email) {
      return res.status(400).json({ message: 'Invalid Google profile data' });
    }

    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = await User.create({ name, email, googleId, role: 'user' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobileNumber: user.mobileNumber || null,
      token: generateToken(user._id),
      isGoogleUser: true,
    });
  } catch (error) {
    console.error('Google Token Auth Error:', error.message);
    res.status(500).json({ message: 'Google authentication failed.' });
  }
};

// @desc    Change password (logged-in user)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({ message: 'Google-authenticated accounts cannot change password here.' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Add password for Google-authenticated users (so they can also login manually)
// @route   POST /api/auth/add-password
// @access  Private
async function addPassword(req, res) {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.googleId) {
      return res.status(400).json({ message: 'This feature is only for Google-authenticated accounts.' });
    }

    if (user.password) {
      return res.status(400).json({ message: 'You already have a password set. Use "Change Password" instead.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password added successfully! You can now sign in with your email and password.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
}

// @desc    Update user profile mobile number
// @route   PUT /api/auth/update-mobile
// @access  Private
const updateMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber || mobileNumber.length !== 10) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.mobileNumber = mobileNumber;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobileNumber: user.mobileNumber,
      token: req.headers.authorization.split(' ')[1], // reuse existing token passed in header
      hasPassword: !!user.password || true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating mobile' });
  }
};

module.exports = {
  sendRegisterOtp,
  registerUser,
  loginUser,
  googleAuth,
  googleAuthToken,
  forgotPassword,
  resetPassword,
  changePassword,
  addPassword,
  verifyGoogleOtp,
  resendGoogleOtp,
  updateMobile,
};
