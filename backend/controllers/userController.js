const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    
    // Validate required fields
    if (!username || !password || !name || !role) {
      return res.status(400).json({ message: 'Username, password, name, and role are required' });
    }
    
    // Validate role
    if (!['admin', 'seller'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either admin or seller' });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      name,
      role
    });
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, role } = req.body;
    
    // Validate required fields
    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required' });
    }
    
    // Validate role
    if (!['admin', 'seller'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either admin or seller' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.password = hashedPassword;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
