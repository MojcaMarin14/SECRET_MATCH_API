const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Uvoz poti
const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/match');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// SERVIRANJE STATIČNIH DATOTEK


const frontendPath = path.join(__dirname, '../../frontend/public');
if (fs.existsSync(frontendPath) && fs.existsSync(path.join(frontendPath, 'index.html'))) {
    console.log(`📁 Serving frontend from: ${frontendPath}`);
    app.use('/js', express.static(path.join(frontendPath, 'js')));
    app.use('/css', express.static(path.join(frontendPath, 'css')));
    app.use(express.static(frontendPath));
} else {
    console.log('⚠️  Frontend not found at:', frontendPath);
}


// DEBUG MIDDLEWARE - za debugging routinga


app.use((req, res, next) => {
    console.log(`📍 ${new Date().toLocaleTimeString()} ${req.method} ${req.path}`);
    next();
});


// API ROUTES


// API dokumentacija
app.get('/api', (req, res) => {
    res.json({
        message: '🎁 Secret Match API',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /users/register',
                login: 'POST /users/login',
                profile: 'GET /users/profile'
            },
            match: {
                join: 'POST /match/join',
                view: 'GET /match/view',
                assign: 'POST /match/assign',
                stats: 'GET /match/stats',
                reset: 'POST /match/reset'
            }
        }
    });
});

// API endpoints
app.use('/users', authRoutes);
app.use('/match', matchRoutes);

// 404 ZA API - če API endpoint ne obstaja


app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

app.use('/users/*', (req, res) => {
    res.status(404).json({ error: 'Users endpoint not found' });
});

app.use('/match/*', (req, res) => {
    res.status(404).json({ error: 'Match endpoint not found' });
});


// FRONTEND SPA - SAMO ZA GET ZAHTEVE


app.get('*', (req, res) => {
    // Če je to API pot, vrni 404 (bi morala biti že obdelana zgoraj)
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/users') || 
        req.path.startsWith('/match')) {
        return res.status(404).json({ 
            error: 'Not found',
            note: 'This looks like an API endpoint but was not handled'
        });
    }
    
    // Serviraj frontend samo za GET zahteve
    if (fs.existsSync(path.join(frontendPath, 'index.html'))) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.status(404).json({ 
            error: 'Frontend not found',
            apiDocs: '/api'
        });
    }
});


// CATCH-ALL za vse OSTALE metode (POST, PUT, DELETE, itd.)


app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        method: req.method,
        path: req.originalUrl,
        note: 'Only GET requests are served as frontend pages',
        apiEndpoints: '/api'
    });
});

// ERROR HANDLING


app.use((err, req, res, next) => {
    console.error('💥 Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// DATABASE & SERVER


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secret-match', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log(' Connected to MongoDB');
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(` Server running on http://localhost:${PORT}`);
        console.log(`Web interface: http://localhost:${PORT}`);
        console.log(`API docs: http://localhost:${PORT}/api`);
        
        console.log('\nAPI ENDPOINTS:');
        console.log('  POST /users/register');
        console.log('  POST /users/login');
        console.log('  POST /match/join  (requires auth)');
        console.log('  GET  /match/view  (requires auth)');
        console.log('  POST /match/assign (admin only)');
        console.log('  POST /match/reset  (admin only)');
        console.log('  GET  /match/stats  (admin only)');
    });
})
.catch(err => {
    console.error(' MongoDB connection error:', err);
    process.exit(1);
});

module.exports = app;