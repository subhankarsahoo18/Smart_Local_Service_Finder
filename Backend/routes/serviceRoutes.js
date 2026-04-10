const express = require('express');
const router = express.Router();
const {
  createService,
  getServices,
  getServiceById,
  updateService,
  uploadServiceImage,
  deleteService,
  addServiceReview,
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getServices)
  .post(protect, authorize('provider'), upload.single('serviceImage'), createService);

router.route('/:id')
  .get(getServiceById)
  .put(protect, authorize('provider'), updateService)
  .delete(protect, authorize('provider'), deleteService);

// Dedicated image upload route — multipart/form-data
router.route('/:id/image')
  .put(protect, authorize('provider'), upload.single('serviceImage'), uploadServiceImage);

router.route('/:id/reviews').post(protect, addServiceReview);

module.exports = router;
