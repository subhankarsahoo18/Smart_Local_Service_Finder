const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-register-otp', sendRegisterOtp);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/google-token', googleAuthToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:id/:token', resetPassword);
router.put('/change-password', protect, changePassword);
router.post('/add-password', protect, addPassword);
router.post('/verify-otp', verifyGoogleOtp);
router.post('/resend-otp', resendGoogleOtp);
router.put('/update-mobile', protect, updateMobile);

module.exports = router;
