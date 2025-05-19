const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Get company profile
router.get('/profile', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.company.id).select('-password');
    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update company profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const company = await Company.findById(req.company.id);

    if (name) company.name = name;
    if (email) company.email = email;

    await company.save();
    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Search students with advanced filters
router.get('/search/students', auth, async (req, res) => {
  try {
    const {
      career,
      minGPA,
      hasExperience,
      certifications,
      yearOfStudy,
      sortBy = 'gpa' // Default sort by GPA
    } = req.query;

    let query = {};
    let sort = {};

    // Build query based on filters
    if (career) {
      query.career = career;
    }

    if (minGPA) {
      query['grades.grade'] = { $gte: parseFloat(minGPA) };
    }

    if (hasExperience === 'true') {
      query.experience = { $exists: true, $not: { $size: 0 } };
    }

    if (certifications) {
      query['certifications.name'] = { $in: certifications.split(',') };
    }

    if (yearOfStudy) {
      query.yearOfStudy = parseInt(yearOfStudy);
    }

    // Build sort object
    switch (sortBy) {
      case 'gpa':
        sort = { 'grades.grade': -1 };
        break;
      case 'experience':
        sort = { 'experience.length': -1 };
        break;
      case 'certifications':
        sort = { 'certifications.length': -1 };
        break;
      default:
        sort = { 'grades.grade': -1 };
    }

    const students = await Student.find(query)
      .select('-__v')
      .sort(sort);

    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get student details
router.get('/students/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('-__v')
      .populate('certifications')
      .populate('experience');

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    res.json(student);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Student not found' });
    }
    res.status(500).send('Server error');
  }
});

// Get available careers
router.get('/careers', auth, async (req, res) => {
  try {
    const careers = await Student.distinct('career');
    res.json(careers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get available certifications
router.get('/certifications', auth, async (req, res) => {
  try {
    const certifications = await Student.distinct('certifications.name');
    res.json(certifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 