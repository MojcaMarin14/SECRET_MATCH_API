// src/services/emailService.js
const nodemailer = require('nodemailer');

console.log(' Loading email service...');

class EmailService {
    constructor() {
        this.testMode = process.env.NODE_ENV !== 'production';
        
        if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
            // Clean password - remove spaces
            const cleanPassword = process.env.EMAIL_PASSWORD.replace(/\s+/g, '');
            
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: cleanPassword
                }
            });
            
            console.log(' Email service configured for Gmail');
            this.testMode = false;
        } else {
            console.log('  Email credentials missing - using TEST MODE');
            this.testMode = true;
        }
    }

    async sendMatchNotification(user, match) {
        if (this.testMode) {
            // TEST MODE - just log
            console.log(` [TEST] Email for ${user.name} (${user.email})`);
            console.log(`   Match: ${match.name} (${match.email})`);
            console.log(`   Preferences: ${match.preferences || 'None'}`);
            
            // Mark as notified in database
            const User = require('../models/User');
            await User.findByIdAndUpdate(user._id, { 
                notified: true,
                notifiedAt: new Date() 
            });
            
            return true;
        }

        if (!this.transporter) {
            console.warn(' Email transporter not available');
            return false;
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || '"Secret Match" <noreply@secretmatch.com>',
                to: user.email,
                subject: ` Secret Match: Your Partner is Ready!`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #4CAF50;">🎁 Secret Match</h1>
                        <h2>Hello ${user.name}!</h2>
                        <p>Your Secret Match has been assigned! 🎉</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #d84315;">🎯 YOUR SECRET MATCH:</h3>
                            <p><strong>Name:</strong> ${match.name}</p>
                            <p><strong>Email:</strong> ${match.email}</p>
                            ${match.preferences ? `<p><strong>Preferences:</strong> ${match.preferences}</p>` : ''}
                        </div>
                        
                        <p>Happy gifting! 🎁</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">
                            Secret Match Team
                        </p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(` Email sent to ${user.email}: ${info.messageId}`);
            
            // Mark as notified in database
            const User = require('../models/User');
            await User.findByIdAndUpdate(user._id, { 
                notified: true,
                notifiedAt: new Date() 
            });
            
            return true;
            
        } catch (error) {
            console.error(` Error sending to ${user.email}:`, error.message);
            return false;
        }
    }
    
    async sendMatchNotificationsToAll() {
        const User = require('../models/User');
        
        // Find users with assigned matches who haven't been notified
        const users = await User.find({ 
            'assignedMatch.userId': { $exists: true, $ne: null },
            hasJoinedEvent: true,
            $or: [
                { notified: { $exists: false } },
                { notified: false }
            ]
        });

        console.log(`📧 Found ${users.length} users to notify`);
        
        let sent = 0;
        let failed = 0;
        const sentTo = [];

        for (const user of users) {
            try {
                const match = await User.findById(user.assignedMatch.userId);
                if (!match) {
                    console.log(`  Match not found for ${user.name}`);
                    failed++;
                    continue;
                }

                const success = await this.sendMatchNotification(user, match);
                if (success) {
                    sent++;
                    sentTo.push(user.email);
                } else {
                    failed++;
                }
                
                // Delay between emails
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(` Error processing ${user.email}:`, error.message);
                failed++;
            }
        }

        return {
            total: users.length,
            sent,
            failed,
            testMode: this.testMode,
            sentTo,
            message: this.testMode 
                ? `[TEST MODE] ${sent} emails simulated${failed > 0 ? `, ${failed} failed` : ''}`
                : ` ${sent} emails sent${failed > 0 ? `, ${failed} failed` : ''}`
        };
    }
}

module.exports = new EmailService();