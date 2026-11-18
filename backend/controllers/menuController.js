const MenuItem = require('../models/MenuItem');

exports.getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const { name, category, price } = req.body;
    
    // Validate required fields
    if (!name || !category || price === undefined || price === null) {
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }
    
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    
    const item = new MenuItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { price } = req.body;
    
    // Validate price if provided
    if (price !== undefined && price !== null) {
      if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ message: 'Price must be a positive number' });
      }
    }
    
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
