const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const seedSeller = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // ચેક કરો કે આ યુઝર પહેલેથી છે કે નહીં
        const existingSeller = await User.findOne({ username: 'seller1' });
        
        if (!existingSeller) {
            const hashedPassword = await bcrypt.hash('seller123', 10);
            
            await User.create({
                name: 'Cafe Cashier',
                username: 'seller1',
                password: hashedPassword,
                role: 'seller',
                isActive: true
            });
            
            console.log('✅ Seller Created Successfully!');
            console.log('👤 Username: seller1');
            console.log('🔑 Password: seller123');
        } else {
            console.log('ℹ️ Seller already exists in database.');
        }
        
        process.exit();
    } catch (error) {
        console.error('❌ Error creating seller:', error);
        process.exit(1);
    }
};

seedSeller();