const express = require("express");
const {
    createCategory,
    getAllCategories,
    getCategoryDetails,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();


router.route("/categories").get(getAllCategories);
router.route("/category/:id").get(getCategoryDetails);


router.route("/admin/category/new")
    .post(isAuthenticatedUser, authorizeRoles("admin"), createCategory);

router.route("/admin/category/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateCategory)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteCategory);

module.exports = router;
