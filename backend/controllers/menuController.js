const MenuItem = require('../models/MenuItem');

const isValidImage = (image) => (
  typeof image === 'string' &&
  image.length <= 80_000 &&
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)
);

const validateMenuFields = (fields, { partial = false } = {}) => {
  const { name, category, price, discountPrice, description, image, available } = fields;

  if (!partial || name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return 'Name is required';
  }
  if (!partial || category !== undefined) {
    if (typeof category !== 'string' || !category.trim()) return 'Category is required';
  }
  if (!partial || price !== undefined) {
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      return 'Price must be a positive number';
    }
  }
  if (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') {
    if (
      typeof discountPrice !== 'number' ||
      !Number.isFinite(discountPrice) ||
      discountPrice <= 0 ||
      (typeof price === 'number' && discountPrice >= price)
    ) {
      return 'Discount price must be positive and less than the regular price';
    }
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 1000)) {
    return 'Description must be 1000 characters or fewer';
  }
  if (image !== undefined && image !== '' && !isValidImage(image)) {
    return 'Optimized image must be a JPEG, PNG, or WebP image smaller than 60 KB';
  }
  if (available !== undefined && typeof available !== 'boolean') {
    return 'Available must be true or false';
  }
  return null;
};

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
    const error = validateMenuFields(req.body);
    if (error) return res.status(400).json({ message: error });

    const item = new MenuItem({
      name: req.body.name.trim(),
      category: req.body.category.trim(),
      price: req.body.price,
      discountPrice: req.body.discountPrice ?? null,
      description: req.body.description?.trim() ?? '',
      image: req.body.image ?? '',
      available: req.body.available ?? true
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const error = validateMenuFields(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });

    const updates = {};
    for (const field of ['name', 'category', 'price', 'discountPrice', 'description', 'image', 'available']) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (typeof updates.name === 'string') updates.name = updates.name.trim();
    if (typeof updates.category === 'string') updates.category = updates.category.trim();
    if (typeof updates.description === 'string') updates.description = updates.description.trim();

    const existing = await MenuItem.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Menu item not found' });
    const nextPrice = updates.price ?? existing.price;
    const nextDiscountPrice = updates.discountPrice === undefined ? existing.discountPrice : updates.discountPrice;
    if (nextDiscountPrice != null && nextDiscountPrice >= nextPrice) {
      return res.status(400).json({ message: 'Discount price must be less than the regular price' });
    }
    Object.assign(existing, updates);
    const item = await existing.save();
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
