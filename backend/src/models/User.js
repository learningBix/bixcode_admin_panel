const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // Ensures no duplicate emails
    lowercase: true, // Converts to lowercase
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Cascade delete: when a User with role 'student' is deleted, remove the linked Student
userSchema.pre('findOneAndDelete', async function(next) {
  try {
    const filter = this.getFilter();
    const doc = await this.model.findOne(filter).lean();
    if (doc && doc.role === 'student') {
      const Student = mongoose.model('Student');
      await Student.deleteMany({
        $or: [
          { userId: doc._id },
          { email: (doc.email || '').toLowerCase() }
        ]
      });
    }
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    if (this.role === 'student') {
      const Student = mongoose.model('Student');
      await Student.deleteMany({
        $or: [
          { userId: this._id },
          { email: (this.email || '').toLowerCase() }
        ]
      });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
