const express = require("express");
const router = express.Router();
const {
    registerSeller,
    loginSeller,
    getAllSellers,
    getSellerById,
    updateSeller,
    deleteSeller,
    updateSellerStatus,
    getSellerStats,
    getSellerDetails,
    forgotPassword,
    resetPassword
} = require("../controllers/sellerController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

// Public routes
router.post("/register", registerSeller);
router.post("/login", loginSeller);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);

// Private routes
router.get("/me", isAuthenticatedUser, getSellerDetails);
router.get("/", isAuthenticatedUser, authorizeRoles("admin"), getAllSellers);
router.get("/:id", isAuthenticatedUser, getSellerById);
router.put("/:id", isAuthenticatedUser, updateSeller);
router.delete("/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteSeller);
router.patch("/:id/status", isAuthenticatedUser, authorizeRoles("admin"), updateSellerStatus);
router.get("/:id/stats", isAuthenticatedUser, getSellerStats);

module.exports = router;