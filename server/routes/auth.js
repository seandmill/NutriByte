const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login/Register with email
router.post('/login', async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // For sign up, require first and last name
      if (!firstName || !lastName) {
        return res.status(400).json({ message: 'First name and last name are required for sign up' });
      }
      
      user = new User({ email, firstName, lastName });
      await user.save();
    } else {
      // For existing users, update first/last name if provided
      if (firstName && lastName) {
        user.firstName = firstName;
        user.lastName = lastName;
      }
      user.lastLogin = new Date();
      await user.save();
    }

    res.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify session
router.get('/verify', async (req, res) => {
  try {
    const email = req.header('X-User-Email');
    
    if (!email) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 