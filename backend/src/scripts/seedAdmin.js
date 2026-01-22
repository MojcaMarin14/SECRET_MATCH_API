const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
require('dotenv').config();

async function seedAdmin() {
  try {
    // Poveži se z bazo
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to database for seeding...');
    
    // Preveri, če admin že obstaja
    const adminEmail = 'admin@secretmatch.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
    }
    
    // Ustvari admin uporabnika
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true,
      preferences: 'System admin account',
      personalMessage: 'Welcome to Secret Match Admin Panel'
    });
    
    await admin.save();
    console.log(' Admin user created successfully!');
    console.log(' Email: admin@secretmatch.com');
    console.log('Password: admin123');
    console.log(' Please change the password after first login!');
    
    await mongoose.disconnect();
    console.log(' Disconnected from database');
  } catch (error) {
    console.error(' Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();