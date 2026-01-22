// Če authMiddleware ne vsebuje .auth in .admin
// backend/src/routes/match.js - SIMPLIFIED
const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Import JWT za preprost auth
const jwt = require('jsonwebtoken');
const User = require('../models/User');

console.log('Match routes module loading...');

// Preprost auth middleware
const simpleAuth = async (req, res, next) => {
    try {
        console.log('🔐 Simple auth checking...');
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log(' No Bearer token');
            return res.status(401).json({ error: 'No authentication token' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = user;
        console.log(` Auth success: ${user.email}`);
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Preprost admin check
const simpleAdmin = (req, res, next) => {
    console.log('👑 Checking admin...');
    
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!req.user.isAdmin) {
        console.log(` ${req.user.email} is not admin`);
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    console.log(` Admin access: ${req.user.email}`);
    next();
};

// Routes
router.post('/join', simpleAuth, matchController.joinEvent);
router.get('/view', simpleAuth, matchController.viewMatch);
router.post('/assign', simpleAuth, simpleAdmin, matchController.assignMatches);
router.post('/reset', simpleAuth, simpleAdmin, matchController.resetMatches);
router.get('/stats', simpleAuth, simpleAdmin, matchController.getStats);
router.post('/notify', simpleAuth, simpleAdmin, matchController.sendNotifications);

console.log(' All match routes configured');

module.exports = router;