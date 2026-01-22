// test-gmail-new.js
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔐 Testing NEW Gmail App Password...');
console.log('Email:', process.env.EMAIL_USER);

// Clean the password (remove spaces)
const password = process.env.EMAIL_PASSWORD.replace(/\s+/g, '');
console.log('Password (16 chars):', password, 'Length:', password.length);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: password
    }
});

console.log('\n🔗 Testing connection...');

transporter.verify((error, success) => {
    if (error) {
        console.error(' Connection failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Go to: https://myaccount.google.com/security');
        console.log('2. Make sure "2-Step Verification" is ON');
        console.log('3. Go to "App passwords"');
        console.log('4. Generate NEW password for "Mail"');
        console.log('5. Copy the NEW 16-character password');
        console.log('6. Update .env file');
    } else {
        console.log('SUCCESS! Gmail connection works with new password!');
        console.log('You can now send emails from your app.');
        
        // Send a test email
        console.log('\n Sending test email...');
        
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: '🎉 Secret Match - Test Email Successful!',
            text: 'Congratulations! Your Gmail email service is working correctly with the new App Password.'
        }, (err, info) => {
            if (err) {
                console.error(' Test email failed:', err.message);
            } else {
                console.log(' Test email sent successfully!');
                console.log(' Check your Gmail inbox');
            }
        });
    }
});