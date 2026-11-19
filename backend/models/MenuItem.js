const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0.01
  },
  discountPrice: {
    type: Number,
    min: 0.01,
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
