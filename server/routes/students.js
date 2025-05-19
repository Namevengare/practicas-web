const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images and PDFs only!');
    }
  }
});

// Get all students with filters
router.get('/', async (req, res) => {
  try {
    const { career, minGPA, hasExperience } = req.query;
    let query = {};

    // Apply filters
    if (career) {
      query.career = career;
    }

    if (minGPA) {
      query['grades.grade'] = { $gte: parseFloat(minGPA) };
    }

    if (hasExperience === 'true') {
      query.experience = { $exists: true, $not: { $size: 0 } };
    }

    const students = await Student.find(query)
      .select('-__v')
      .sort({ 'grades.grade': -1 }); // Sort by GPA

    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-__v');
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

// Update student photo
router.put('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    student.photo = req.file.path;
    await student.save();

    res.json({ msg: 'Photo updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update student information
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    const {
      name,
      career,
      yearOfStudy,
      grades,
      approvedCourses
    } = req.body;

    // Update fields if provided
    if (name) student.name = name;
    if (career) student.career = career;
    if (yearOfStudy) student.yearOfStudy = yearOfStudy;
    if (grades) student.grades = grades;
    if (approvedCourses) student.approvedCourses = approvedCourses;

    await student.save();
    res.json(student);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add certification
router.post('/:id/certifications', upload.single('file'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    const { name, institution, date } = req.body;
    const certification = {
      name,
      institution,
      date,
      file: req.file ? req.file.path : null
    };

    student.certifications.push(certification);
    await student.save();

    res.json(student.certifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add experience
router.post('/:id/experience', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    const {
      company,
      position,
      startDate,
      endDate,
      description
    } = req.body;

    const experience = {
      company,
      position,
      startDate,
      endDate,
      description
    };

    student.experience.push(experience);
    await student.save();

    res.json(student.experience);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 