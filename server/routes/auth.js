const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const Company = require('../models/Company');

// Middleware to validate company registration
const validateRegistration = [
  check('name').notEmpty().withMessage('Company name is required'),
  check('email').isEmail().withMessage('Please include a valid email'),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one number, and one special character')
];

// Register company
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if company already exists
    let company = await Company.findOne({ $or: [{ email }, { name }] });
    if (company) {
      return res.status(400).json({ msg: 'Company already exists' });
    }

    // Create new company
    company = new Company({
      name,
      email,
      password
    });

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: company._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    company.verificationToken = verificationToken;

    await company.save();

    // Send verification email
    const transporter = nodemailer.createTransport({
      // Configure your email service here
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your company account',
      html: `Please click the following link to verify your account: 
        <a href="${process.env.FRONTEND_URL}/verify/${verificationToken}">Verify Account</a>`
    });

    res.json({ msg: 'Registration successful. Please check your email to verify your account.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login company
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if company exists
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if company is verified
    if (!company.isVerified) {
      return res.status(400).json({ msg: 'Please verify your email first' });
    }

    // Check password
    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: company._id },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Update last login
    company.lastLogin = Date.now();
    await company.save();

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
  try {
    const company = await Company.findOne({ verificationToken: req.params.token });
    if (!company) {
      return res.status(400).json({ msg: 'Invalid verification token' });
    }

    company.isVerified = true;
    company.verificationToken = undefined;
    await company.save();

    res.json({ msg: 'Email verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Setup 2FA
router.post('/setup-2fa', async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: 'Student CV System'
    });

    const company = await Company.findById(req.company.id);
    company.twoFactorSecret = secret.base32;
    await company.save();

    res.json({
      secret: secret.base32,
      qrCode: secret.otpauth_url
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify 2FA
router.post('/verify-2fa', async (req, res) => {
  try {
    const { token } = req.body;
    const company = await Company.findById(req.company.id);

    const verified = speakeasy.totp.verify({
      secret: company.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ msg: 'Invalid 2FA token' });
    }

    res.json({ msg: '2FA verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 