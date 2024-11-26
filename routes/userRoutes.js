const express = require('express');
const User = require('../models/User');  // Assuming the model is in the 'models' directory
const jwt = require('jsonwebtoken');
const { protect, isAdmin, isUser } = require('../middleware/auth'); // Import the middleware
const router = express.Router();
// Signup Route (No password hashing)
router.post('/signup', async (req, res) => {
  const { name, mobile, email, password } = req.body;

  if (!name || !mobile || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ mobile }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Log the plain password for debugging
    console.log('Plain password being saved:', password);

    // Create new user without hashing password (storing plain text password)
    const newUser = new User({ name, mobile, email, passwordHashed: password });
    await newUser.save();
    console.log('New user created successfully:', newUser);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Route (No password hashing)
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ error: 'Mobile and Password are required' });
  }

  try {
    // Find the user by mobile number
    const user = await User.findOne({ mobile });
    if (!user) {
      // console.log('User not found with mobile:', mobile);  // Debug log
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Log the password values for debugging
    // console.log('Password entered:', password);
    // console.log('Stored password:', user.passwordHashed);

    // Compare passwords directly (no hashing, plain text comparison)
    if (password !== user.passwordHashed) {
      // console.log('Password mismatch');  // Debug log
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '10m' });

    // Send response with token and user role
    res.status(200).json({
      message: 'Login successful',
      token,
      isAdmin: user.isAdmin
    });

    // console.log('Login successful, token:', token);  // Debug log
  } catch (error) {
    console.error('Error during login:', error);  // Debug log
    res.status(500).json({ error: 'Server error' });
  }
});

// Example of a protected route: /me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Update user data (Logged-in user only)
router.put('/admin/update', protect, isAdmin, async (req, res) => {
  const { name, mobile, email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the email is being changed, and if the new email is already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already in use by another account' });
      }
    }

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHashed = await bcrypt.hash(password, salt);
    }

    // Update other fields
    user.name = name || user.name;
    user.mobile = mobile || user.mobile;
    user.email = email || user.email;

    await user.save();
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin route to get all users
router.get('/admin/users', protect, isAdmin, async (req, res) => {
  try {
    // Fetch all users (excluding passwords for security reasons)
    const users = await User.find().select('-passwordHashed');  // Exclude password
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin route to delete a user
router.delete('/admin/delete/:id', protect, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the user using deleteOne
    await User.deleteOne({ _id: id }); // Alternatively, you can use User.findByIdAndDelete(id)
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin route to create a new user without bcrypt or password hashing
router.post('/admin/create', protect, isAdmin, async (req, res) => {
  const { name, mobile, email, password } = req.body;

  if (!name || !mobile || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ mobile }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Directly save the password as plain text (no hashing, no bcrypt)
    const newUser = new User({ name, mobile, email, passwordHashed: password });  // Store plain text password
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error during admin create user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (Admin)
router.get('/admin/users', protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHashed'); // Exclude password
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Make user admin (Admin)
router.put('/admin/make-admin/:id', protect, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isAdmin = true;
    await user.save();
    res.status(200).json({ message: 'User updated to admin', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
// Toggle user admin status (Admin)
router.put('/admin/toggle-admin/:id', protect, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle admin status
    user.isAdmin = !user.isAdmin;
    await user.save();

    res.status(200).json({ message: `User admin status updated to ${user.isAdmin ? 'admin' : 'non-admin'}`, user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
