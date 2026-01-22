const User = require('../models/User');
const Event = require('../models/Event');

exports.joinEvent = async (req, res) => {
    try {
        console.log(' Join event called for user:', req.user.email);
        
        // Pridruži se dogodku
        req.user.hasJoinedEvent = true;
        await req.user.save();
        
        res.json({ 
            message: 'Uspešno ste se pridružili dogodku!',
            user: {
                name: req.user.name,
                email: req.user.email,
                hasJoinedEvent: req.user.hasJoinedEvent
            }
        });
    } catch (error) {
        console.error('Join event error:', error);
        res.status(500).json({ error: 'Napaka pri pridružitvi dogodku' });
    }
};
exports.viewMatch = async (req, res) => {
    try {
        console.log(' View match called for user:', req.user.email);
        
        // Poišči uporabnika z assignedMatch
        const user = await User.findById(req.user._id);
        
        if (!user) {
            console.log(' User not found');
            return res.status(404).json({ error: 'Uporabnik ni najden' });
        }
        
        console.log(' User assignedMatch:', user.assignedMatch);
        
        if (!user.assignedMatch || !user.assignedMatch.userId) {
            console.log(' No assigned match found');
            return res.status(400).json({ error: 'Pari še niso dodeljeni ali nimate dodeljenega para' });
        }
        
        // Poišči match uporabnika
        const matchUser = await User.findById(user.assignedMatch.userId);
        
        if (!matchUser) {
            console.log(' Match user not found with ID:', user.assignedMatch.userId);
            return res.status(404).json({ error: 'Vaš match ni več v bazi' });
        }
        
        console.log(' Match found:', matchUser.email);
        
        res.json({
            yourMatch: {
                name: matchUser.name,
                email: matchUser.email,
                preferences: matchUser.preferences || ''
            }
        });
    } catch (error) {
        console.error(' View match error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Napaka pri pridobivanju para',
            details: error.message 
        });
    }
};

exports.assignMatches = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Dovoljenje zavrnjeno' });
        }
        
        let event = await Event.findOne();
        if (event && event.pairingsAssigned) {
            return res.status(400).json({ 
                error: 'Pari so že dodeljeni! Najprej jih resetirajte.' 
            });
        }
        
        const participants = await User.find({ 
            hasJoinedEvent: true,
            isAdmin: false
        });
        
        if (participants.length < 2) {
            return res.status(400).json({ 
                error: 'Potrebujemo vsaj 2 udeleženca za dodelitev parov!' 
            });
        }
        
        console.log(`👥 Matching ${participants.length} participants`);
        
        // Naključno premešaj
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        
        // KROŽNO DELITVY - najbolj preprosto in deluje
        console.log(' Assigning matches (circular pairing):');
        
        for (let i = 0; i < shuffled.length; i++) {
            const currentUser = shuffled[i];
            const matchUser = shuffled[(i + 1) % shuffled.length];
            
            // Preveri, da ni sam sebi (za 1 osebo, ampak to ne bi smelo biti)
            if (currentUser._id.toString() !== matchUser._id.toString()) {
                currentUser.assignedMatch = {
                    userId: matchUser._id,
                    name: matchUser.name,
                    email: matchUser.email,
                    preferences: matchUser.preferences || ''
                };
                await currentUser.save();
                
                console.log(`  ${currentUser.name} → ${matchUser.name}`);
            } else {
                console.warn(`⚠️  Self-match prevented for ${currentUser.name}`);
            }
        }
        
        // Posodobi event
        event = await Event.findOneAndUpdate(
            {},
            { 
                $set: { 
                    pairingsAssigned: true,
                    eventName: 'Secret Match ' + new Date().getFullYear(),
                    lastAssigned: new Date()
                } 
            },
            { upsert: true, new: true }
        );
        
        res.json({ 
            message: `Pari uspešno dodeljeni za ${participants.length} udeležencev!`,
            participantsCount: participants.length,
            note: 'Vsak udeleženec ima enega secret match.'
        });
        
    } catch (error) {
        console.error('Error assigning matches:', error);
        res.status(500).json({ error: 'Napaka pri dodeljevanju parov' });
    }
};
exports.resetMatches = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Dovoljenje zavrnjeno' });
        }
        
        console.log(' Resetting matches for admin:', req.user.email);
        
        // Resetiraj assignedMatch pri vseh uporabnikih
        await User.updateMany(
            {},
            { $set: { assignedMatch: null } }
        );
        
        // Resetiraj event status
        await Event.findOneAndUpdate(
            {},
            { 
                $set: { 
                    pairingsAssigned: false,
                    lastReset: new Date() 
                } 
            },
            { upsert: true, new: true }
        );
        
        // Preveri rezultat
        const usersWithMatch = await User.countDocuments({ 
            assignedMatch: { $ne: null } 
        });
        
        console.log(` Reset complete. Users still with match: ${usersWithMatch}`);
        
        res.json({ 
            message: 'Pari so bili resetirani. Lahko dodelite nove pare.',
            resetAt: new Date(),
            usersWithMatchAfterReset: usersWithMatch
        });
        
    } catch (error) {
        console.error(' Error resetting matches:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Napaka pri resetiranju parov',
            details: error.message 
        });
    }
};
// ============================================
// EMAIL NOTIFICATIONS
// ============================================

// V vašem matchController.js, najdi sendNotifications funkcijo in popravi:
exports.sendNotifications = async (req, res) => {
    try {
        console.log('Admin requesting email notifications...');
        
        // Preveri admin pravice
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        // DEBUG: Preveri Event model
        console.log(' Checking Event model...');
        const event = await Event.findOne();
        console.log(' Event document:', event);
        
        // PREVERI NEZAVISNO - preštej uporabnike z assignedMatch
        const usersWithMatches = await User.countDocuments({ 
            'assignedMatch.userId': { $exists: true, $ne: null },
            hasJoinedEvent: true
        });
        
        console.log(` Users with assigned matches: ${usersWithMatches}`);
        
        // Če ni Event dokumenta ali ni pairingsAssigned, AMPAK imamo uporabnike z matchi
        if (usersWithMatches === 0) {
            return res.status(400).json({ 
                error: 'Ni uporabnikov z dodeljenimi pari!',
                details: 'Dodelite pare najprej z POST /match/assign',
                eventStatus: event ? event.pairingsAssigned : 'no event document',
                userCount: usersWithMatches
            });
        }
        
        // Pridobi vse uporabnike z dodeljenimi pari za email
        const users = await User.find({ 
            'assignedMatch.userId': { $exists: true, $ne: null },
            hasJoinedEvent: true
        });
        
        console.log(` Found ${users.length} users for email notifications`);
        
        if (users.length === 0) {
            return res.status(400).json({ 
                error: 'Ni uporabnikov za email obvestila',
                suggestion: 'Preverite da uporabniki imajo hasJoinedEvent: true'
            });
        }
        
        // Prikaži katerim uporabnikom bi poslali email
        console.log(' Users to notify:');
        users.forEach(user => {
            console.log(`  • ${user.name} <${user.email}> → ${user.assignedMatch.name}`);
        });
        
        // Preveri če email service obstaja
        let emailService;
        try {
            emailService = require('../services/emailService');
            console.log(' Email service loaded');
        } catch (emailError) {
            console.log(' Email service not available:', emailError.message);
            
            // V testnem načinu vrnemo simulacijo
            return res.json({
                success: true,
                message: '[TEST MODE] Email service not configured',
                sent: users.length,
                failed: 0,
                total: users.length,
                testMode: true,
                users: users.map(u => ({
                    name: u.name,
                    email: u.email,
                    match: u.assignedMatch.name
                })),
                note: 'Ustvarite src/services/emailService.js za resnične emaile'
            });
        }
        
        // Pošlji emaile
        const result = await emailService.sendMatchNotificationsToAll();
        
        res.json({
            success: true,
            message: result.message || 'Email notifications processed',
            sent: result.sent || 0,
            failed: result.failed || 0,
            total: result.total || users.length,
            sentTo: result.sentTo || [],
            testMode: result.testMode || false
        });
        
    } catch (error) {
        console.error(' Error in sendNotifications:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Email notification error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.getStats = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Dovoljenje zavrnjeno' });
        }
        
        const event = await Event.findOne();
        const participants = await User.find({ 
            hasJoinedEvent: true,
            isAdmin: false
        }).select('name email preferences');
        
        res.json({
            eventName: event ? event.eventName : 'Secret Match',
            participantsCount: participants.length,
            pairingsAssigned: event ? event.pairingsAssigned : false,
            participants: participants,
            lastAssigned: event ? event.lastAssigned : null
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Napaka pri pridobivanju statistike' });
    }
};