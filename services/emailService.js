const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Use port 465 for secure SSL connection
    secure: true, // Use SSL
    auth: {
        user: "shielddfweb@gmail.com",
        pass: "ycniifglznkzcnld"
    }
});

const sendEmail = async (to,fullName, subject, username, password) => {
    try {
        const htmlContent = `
            <p>Dear ${fullName},</p>
            <p>Welcome to Shield! Your account is now active with the following credentials:</p>
            <p>Username: ${username}</p>
            <p>Password: ${password}</p>
            <p>Please log in at your earliest convenience. 
            Upon your first login, you'll be prompted to change your password for added security.</p>
            <p>Thank you for using Shield!</p>
        `;

        const info = await transporter.sendMail({
            from: 'shielddfweb@gmail.com', // Sender email address
            to,
            subject,
            html: htmlContent
        });

        console.log('Email sent:', info);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
module.exports = { sendEmail };
