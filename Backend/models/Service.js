const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerName: {
      type: String,
      required: true,
    },
    serviceName: {
      type: String,
      required: [true, 'Please add a service name'],
    },
    serviceType: {
      type: String,
      required: [true, 'Please add a service type (e.g., Electrician, Plumber)'],
    },
    location: {
      type: String,
      required: [true, 'Please add a location (City / Area)'],
    },
    locationCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: false
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false
      }
    },
    serviceCharges: {
      type: Number,
      required: [true, 'Please add service charges'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Please add a mobile number'],
      match: [/^[0-9]{10,15}$/, 'Please add a valid mobile number'],
    },
    description: {
      type: String,
      required: false,
    },
    serviceImage: {
      type: String,
      required: false,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
serviceSchema.index({ locationCoordinates: '2dsphere' });

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
