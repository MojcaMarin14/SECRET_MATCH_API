const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registracija
exports.register = async (req, res) => {
  try {
    const { name, email, password, preferences, personalMessage } = req.body;
    
    // Validacija
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    
    // Preveri, če uporabnik že obstaja
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Ustvari novega uporabnika
    const user = new User({
      name,
      email,
      password: hashedPassword,
      preferences: preferences || '',
      personalMessage: personalMessage || '',
      isAdmin: req.body.isAdmin || false  // Dodano
    });
    
    await user.save();
    
    // Ustvari JWT token
  const token = jwt.sign(
  { 
    userId: user._id.toString(),  // ← DODAJTE .toString()!
    email: user.email, 
    isAdmin: user.isAdmin || false
  },
  process.env.JWT_SECRET || 'fallback_secret_key',
  { expiresIn: '7d' }
);
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,  // Dodano
        preferences: user.preferences,
        personalMessage: user.personalMessage
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Prijava
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validacija
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Najdi uporabnika
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Preveri geslo
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Ustvari JWT token
   const token = jwt.sign(
  { 
    userId: user._id.toString(),  // ← DODAJTE .toString()!
    email: user.email, 
    isAdmin: user.isAdmin || false
  },
  process.env.JWT_SECRET || 'fallback_secret_key',
  { expiresIn: '7d' }
);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,  // Dodano
        hasJoinedEvent: user.hasJoinedEvent || false,
        preferences: user.preferences,
        personalMessage: user.personalMessage
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// V controllers/userController.js
exports.getProfile = async (req, res) => {
  try {
    // Pridobi cel uporabnikov dokument
    const user = await User.findById(req.user._id);
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        hasJoinedEvent: user.hasJoinedEvent || false,
        preferences: user.preferences,
        personalMessage: user.personalMessage,
        // DODAJ TO ↓↓↓
        assignedMatch: user.assignedMatch || null,
        // Dodaj tudi createdDate če je potrebno
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};