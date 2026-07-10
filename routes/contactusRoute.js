const express = require("express");
const {
    createContact,
    getAllContacts,
    getContactDetails,
    deleteContact
} = require("../controllers/contactusController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

// PUBLIC → Get all contact messages
router.route("/contactus").get(getAllContacts);

// PUBLIC → Create new contact message
router.route("/contactus/new").post(createContact);

// ADMIN → Get all contacts securely
router.route("/admin/contactus")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getAllContacts);

// ADMIN → Get single contact + delete
router.route("/admin/contactus/:id")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getContactDetails)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteContact);

module.exports = router;
