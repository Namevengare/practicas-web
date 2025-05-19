const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Student = require('../models/Student');
const fs = require('fs');
const path = require('path');

// Generate CV PDF
router.get('/generate/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Create PDF document
    const doc = new PDFDocument();
    const pdfPath = path.join(__dirname, '../temp', `${student.identificationNumber}.pdf`);

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(pdfPath));

    // Add content to PDF
    doc.fontSize(25).text('Curriculum Vitae', { align: 'center' });
    doc.moveDown();

    // Add student photo
    if (student.photo) {
      doc.image(student.photo, {
        fit: [100, 100],
        align: 'center'
      });
      doc.moveDown();
    }

    // Personal Information
    doc.fontSize(16).text('Personal Information');
    doc.fontSize(12)
      .text(`Name: ${student.name}`)
      .text(`ID: ${student.identificationNumber}`)
      .text(`Career: ${student.career}`)
      .text(`Year of Study: ${student.yearOfStudy}`);
    doc.moveDown();

    // Academic Information
    doc.fontSize(16).text('Academic Information');
    doc.fontSize(12).text('Grades:');
    student.grades.forEach(grade => {
      doc.text(`${grade.subject}: ${grade.grade} (${grade.semester})`);
    });
    doc.moveDown();

    // Approved Courses
    doc.fontSize(16).text('Approved Courses');
    student.approvedCourses.forEach(course => {
      doc.text(`${course.name}: ${course.grade} (${course.semester})`);
    });
    doc.moveDown();

    // Certifications
    if (student.certifications.length > 0) {
      doc.fontSize(16).text('Certifications');
      student.certifications.forEach(cert => {
        doc.text(`${cert.name} - ${cert.institution} (${cert.date.toLocaleDateString()})`);
      });
      doc.moveDown();
    }

    // Experience
    if (student.experience.length > 0) {
      doc.fontSize(16).text('Work Experience');
      student.experience.forEach(exp => {
        doc.text(`${exp.position} at ${exp.company}`)
          .text(`${exp.startDate.toLocaleDateString()} - ${exp.endDate ? exp.endDate.toLocaleDateString() : 'Present'}`)
          .text(exp.description)
          .moveDown();
      });
    }

    // Finalize PDF
    doc.end();

    // Send PDF file
    res.download(pdfPath, `${student.name}-CV.pdf`, (err) => {
      if (err) {
        console.error('Error sending PDF:', err);
      }
      // Clean up temporary file
      fs.unlink(pdfPath, (err) => {
        if (err) console.error('Error deleting temporary PDF:', err);
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update student CV information
router.put('/update/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    const {
      certifications,
      experience
    } = req.body;

    // Update certifications
    if (certifications) {
      student.certifications = certifications;
    }

    // Update experience
    if (experience) {
      student.experience = experience;
    }

    await student.save();
    res.json(student);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 