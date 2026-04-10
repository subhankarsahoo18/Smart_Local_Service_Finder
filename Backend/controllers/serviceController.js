const Service = require('../models/Service');
const path = require('path');
const fs = require('fs');

// @desc    Create a new service
// @route   POST /api/services
// @access  Private/Provider
const createService = async (req, res) => {
  try {
    const {
      serviceName,
      serviceType,
      location,
      serviceCharges,
      mobileNumber,
      description,
      latitude,
      longitude
    } = req.body;

    const service = new Service({
      provider: req.user._id,
      providerName: req.user.name,
      serviceName,
      serviceType,
      location,
      serviceCharges,
      mobileNumber,
      description,
    });

    if (latitude && longitude) {
      service.locationCoordinates = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    // If image was uploaded together with form data
    if (req.file) {
      service.serviceImage = `/uploads/${req.file.filename}`;
    }

    const createdService = await service.save();
    res.status(201).json(createdService);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid service data' });
  }
};

// @desc    Get all services / search
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const { location, serviceType, keyword, lat, lng } = req.query;

    let query = {};

    // 10km Radius Geospatial Search
    if (lat && lng) {
      query.locationCoordinates = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 10000 // 10 kilometers
        }
      };
    } else if (location) {
      // Fallback to text matching if no exact location enabled
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by service type
    if (serviceType) {
      query.serviceType = { $regex: serviceType, $options: 'i' };
    }

    // Search by keyword (serviceName or description)
    if (keyword) {
      query.$or = [
        { serviceName: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    const services = await Service.find(query);
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching services' });
  }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'provider',
      'name email'
    );

    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching service' });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Provider
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (service) {
      // Check if the user is the provider of the service
      if (service.provider.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: 'Not authorized to update this service' });
      }

      service.serviceName = req.body.serviceName || service.serviceName;
      service.serviceType = req.body.serviceType || service.serviceType;
      service.location = req.body.location || service.location;
      service.serviceCharges = req.body.serviceCharges || service.serviceCharges;
      service.mobileNumber = req.body.mobileNumber || service.mobileNumber;
      service.description = req.body.description || service.description;

      const updatedService = await service.save();
      res.json(updatedService);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating service' });
  }
};

// @desc    Upload / update service image
// @route   PUT /api/services/:id/image
// @access  Private/Provider
const uploadServiceImage = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this service' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Delete old image file if it exists
    if (service.serviceImage) {
      const oldPath = path.join(__dirname, '..', service.serviceImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    service.serviceImage = `/uploads/${req.file.filename}`;
    const updatedService = await service.save();
    res.json({ serviceImage: updatedService.serviceImage, message: 'Image uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error uploading image' });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Provider
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (service) {
      // Check if the user is the provider of the service
      if (service.provider.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: 'Not authorized to delete this service' });
      }

      // Delete image file if exists
      if (service.serviceImage) {
        const imgPath = path.join(__dirname, '..', service.serviceImage);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }

      await Service.deleteOne({ _id: service._id });
      res.json({ message: 'Service removed' });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting service' });
  }
};

// @desc    Create new review
// @route   POST /api/services/:id/reviews
// @access  Private
const addServiceReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const service = await Service.findById(req.params.id);

    if (service) {
      // Check if already reviewed
      const alreadyReviewed = service.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Service already reviewed' });
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      service.reviews.push(review);
      service.numReviews = service.reviews.length;
      service.rating =
        service.reviews.reduce((acc, item) => item.rating + acc, 0) /
        service.reviews.length;

      await service.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error adding review' });
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  uploadServiceImage,
  deleteService,
  addServiceReview,
};
