const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  identificationNumber: {
    type: String,
    required: true,
    unique: true
  },
  career: {
    type: String,
    required: true
  },
  yearOfStudy: {
    type: Number,
    required: true
  },
  photo: {
    type: String,
    required: true
  },
  grades: [{
    subject: String,
    grade: Number,
    semester: String
  }],
  approvedCourses: [{
    name: String,
    grade: Number,
    semester: String
  }],
  certifications: [{
    name: String,
    institution: String,
    date: Date,
    file: String
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
StudentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', StudentSchema); 