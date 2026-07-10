const sgMail = require('@sendgrid/mail')

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'YOUR_SENDGRID_API_KEY' && SENDGRID_API_KEY.startsWith("SG.")) {
    sgMail.setApiKey(SENDGRID_API_KEY);
} else {
    console.warn("[SG WARNING] SENDGRID_API_KEY is missing or invalid. Email functionality will be disabled.");
}

const sendEmail = async (options) => {

    const msg = {
        to: options.email,
        from: process.env.SENDGRID_MAIL,
        templateId: options.templateId,
        dynamic_template_data: options.data,
        // Fallback for standard emails if templateId is not provided
        subject: options.subject,
        text: options.message,
        html: options.html || options.message,
    }

    try {
        await sgMail.send(msg);
        console.log('Email Sent Successfully to:', options.email);
    } catch (error) {
        console.error('SendGrid Error details:', error.response?.body || error.message);
        
        if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'YOUR_SENDGRID_API_KEY') {
            throw new Error("Email service is not configured (Missing SENDGRID_API_KEY). Please contact support.");
        }
        
        throw new Error(error.response?.body?.errors?.[0]?.message || "Failed to send email. Please try again later.");
    }
};

module.exports = sendEmail;