import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  disasterType: {
    type: String,
    enum: ['Flood', 'Fire', 'Earthquake', 'Other'],
    default: 'Other',
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5,
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending',
  },
  isSOS: {
    type: Boolean,
    default: false,
  },
  images: [{
    type: String, // URLs to uploaded images
  }],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verificationNotes: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

// Create 2dsphere index for location queries
reportSchema.index({ location: '2dsphere' });

// Create indexes for common queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ disasterType: 1 });
reportSchema.index({ isSOS: 1 });

export default mongoose.models.Report || mongoose.model('Report', reportSchema);
