const sendWhatsapp = async (options) => {
    // -------------------------------------------------------------------------
    // NOTE: To send REAL WhatsApp messages, you need a Twilio Account.
    // 1. Sign up at twilio.com
    // 2. Get Account SID and Auth Token
    // 3. Set up a WhatsApp Sandbox
    // -------------------------------------------------------------------------

    // const accountSid = process.env.TWILIO_SID;
    // const authToken = process.env.TWILIO_AUTH_TOKEN;
    // const client = require('twilio')(accountSid, authToken);

    const message = `*Order Confirmation* 📦\n\nHello *${options.name}*,\n\nYour order has been placed successfully!\n\n🆔 *Order ID:* ${options.orderId}\n💰 *Amount:* ₹${options.totalPrice}\n🚚 *Status:* Processing\n\nThank you for choosing *Shree Kishan Aayushi*!`;

    try {

        // UNCOMMENT THIS BLOCK TO USE TWILIO
        /*
        await client.messages.create({
            body: message,
            from: 'whatsapp:+14155238886', // Your Twilio WhatsApp Number
            to: `whatsapp:+91${options.phoneNo}`
        });
        */

        // SIMULATION LOG
        console.log("\n==================================================");
        console.log("📲 WHATSAPP NOTIFICATION TRIGGERED");
        console.log("--------------------------------------------------");
        console.log(`To: +91${options.phoneNo}`);
        console.log(`Message:\n${message}`);
        console.log("==================================================\n");

    } catch (error) {
        console.error("WhatsApp Error:", error.message);
    }
};

module.exports = sendWhatsapp;
