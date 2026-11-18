const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await User.create({
                name: 'Cafe Admin',
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
                isActive: true
            });
            
            console.log('✅ Admin Created Successfully!');
            console.log('👤 Username: admin');
            console.log('🔑 Password: admin123');
        } else {
            console.log('ℹ️ Admin already exists in database.');
        }
        
        process.exit();
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

seedAdmin();