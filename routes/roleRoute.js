const express = require("express");
const {
    createRole,
    getAllRoles,
    getRoleDetails,
    updateRole,
    deleteRole
} = require("../controllers/roleController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

// PUBLIC (optional)
router.route("/roles").get(getAllRoles);
router.route("/role/:id").get(getRoleDetails);

// ADMIN
router.route("/admin/role/new")
    .post(isAuthenticatedUser, authorizeRoles("admin"), createRole);

router.route("/admin/role/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateRole)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteRole);

module.exports = router;
