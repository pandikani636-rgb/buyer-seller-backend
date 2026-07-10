const mongoose = require("mongoose");
const Counter = require("./counterModel");

const contactusSchema = new mongoose.Schema({
    contactId: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: [true, "Please enter name"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Please enter email"],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email"
        ]
    },
    phone: {
        type: String,
        required: [true, "Please enter phone number"],
        match: [
            /^[0-9]{10}$/,
            "Phone number must be 10 digits"
        ]
    },
    message: {
        type: String,
        required: [true, "Please enter message"],
        minlength: [5, "Message must be at least 5 characters"]
    },
    orderId: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-increment contactId
contactusSchema.pre("save", async function (next) {
    if (!this.isNew) return next();

    const counter = await Counter.findByIdAndUpdate(
        { _id: "contactId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    this.contactId = counter.seq;
    next();
});

module.exports = mongoose.model("Contactus", contactusSchema);
