const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect middleware to verify the JWT token
const protect = async (req, res, next) => {
  let token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    token = token.split(' ')[1]; // If token is in format 'Bearer token'
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  } else {
    return res.status(403).json({ error: 'Access denied. Admins only' });
  }
};

// Middleware to check if user is a normal user
const isUser = (req, res, next) => {
  if (req.user && !req.user.isAdmin) {
    return next();
  } else {
    return res.status(403).json({ error: 'Access denied. Users only' });
  }
};

// Export the middleware functions correctly
module.exports = { protect, isAdmin, isUser };
