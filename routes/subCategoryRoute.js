const express = require("express");
const {
    createSubCategory,
    getAllSubCategories,
    getSubCategoryDetails,
    updateSubCategory,
    deleteSubCategory
} = require("../controllers/subCategoryController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

router.route("/subcategories").get(getAllSubCategories);

router.route("/admin/subcategory/new").post(isAuthenticatedUser, authorizeRoles("admin"), createSubCategory);

router.route("/admin/subcategory/:id")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getSubCategoryDetails)
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateSubCategory)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteSubCategory);

module.exports = router;
