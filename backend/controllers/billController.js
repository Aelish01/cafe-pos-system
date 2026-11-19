const Bill = require('../models/Bill');
const MenuItem = require('../models/MenuItem');

exports.createBill = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!['cash', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Payment method must be cash or online' });
    }
    
    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required and must not be empty' });
    }
    
    // Validate and fetch menu items
    const billItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      // Validate item structure
      if (!item.menuItemId) {
        return res.status(400).json({ message: 'Each item must have a menuItemId' });
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ message: 'Each item must have a positive quantity' });
      }
      
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item ${item.menuItemId} not found` });
      }
      if (!menuItem.available) {
        return res.status(400).json({ message: `Menu item ${menuItem.name} is not available` });
      }
      
      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;
      
      billItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity
      });
    }
    
    const bill = new Bill({
      items: billItems,
      totalAmount,
      paymentMethod,
      createdBy: req.user.id,
      createdByName: req.user.name
    });
    
    await bill.save();
    const populatedBill = await Bill.findById(bill._id).populate('createdBy', 'name username');
    
    res.status(201).json(populatedBill);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name username');
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTodayBills = async (req, res) => {
  try {
    // Calculate IST today start and end (IST = UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    
    // Get current time in IST and extract date string
    const istNow = new Date(Date.now() + istOffset);
    const istDateStr = istNow.toISOString().slice(0, 10); // "YYYY-MM-DD"
    
    // Calculate UTC timestamps for IST day boundaries
    const startUTC = new Date(`${istDateStr}T00:00:00.000Z`).getTime() - istOffset;
    const endUTC = new Date(`${istDateStr}T23:59:59.999Z`).getTime() - istOffset;
    
    const bills = await Bill.find({
      createdAt: { $gte: new Date(startUTC), $lte: new Date(endUTC) }
    })
    .sort({ createdAt: -1 });
    
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
