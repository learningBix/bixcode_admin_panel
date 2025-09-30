const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [200, 'School name cannot exceed 200 characters']
  },
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [50, 'Class name cannot exceed 50 characters']
  },
  // Persist the initially issued plain password for admin visibility
  initialPassword: {
    type: String,
    required: false,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for now
  },
  projects: [{
    projectTitle: {
      type: String,
      required: true,
      trim: true
    },
    projectData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    },
    projectId: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better search performance
studentSchema.index({ name: 'text', email: 'text', schoolName: 'text', className: 'text' });
studentSchema.index({ email: 1 });
studentSchema.index({ phone: 1 });
studentSchema.index({ schoolName: 1 });
studentSchema.index({ className: 1 });
studentSchema.index({ createdAt: -1 });

// Virtual for formatted phone number
studentSchema.virtual('formattedPhone').get(function() {
  const phone = this.phone;
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
});

// Static method to search students
studentSchema.statics.searchStudents = function(searchTerm, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const query = searchTerm ? {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
      { schoolName: { $regex: searchTerm, $options: 'i' } },
      { className: { $regex: searchTerm, $options: 'i' } }
    ]
  } : {};

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get total count for pagination
studentSchema.statics.getTotalCount = function(searchTerm) {
  const query = searchTerm ? {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
      { schoolName: { $regex: searchTerm, $options: 'i' } },
      { className: { $regex: searchTerm, $options: 'i' } }
    ]
  } : {};

  return this.countDocuments(query);
};

module.exports = mongoose.model('Student', studentSchema);
