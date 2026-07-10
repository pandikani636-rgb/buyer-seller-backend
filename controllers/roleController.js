const Role = require("../models/roleModel");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");

// Create Role ---ADMIN
exports.createRole = asyncErrorHandler(async (req, res, next) => {
    const { name } = req.body;

    if (!name) {
        return next(new ErrorHandler("Role name is required", 400));
    }

    const role = await Role.create({ name });

    res.status(201).json({
        success: true,
        role,
    });
});

// Get All Roles
exports.getAllRoles = asyncErrorHandler(async (req, res, next) => {
    const roles = await Role.find();

    res.status(200).json({
        success: true,
        roles
    });
});

// Get Single Role
exports.getRoleDetails = asyncErrorHandler(async (req, res, next) => {
    const role = await Role.findById(req.params.id);

    if (!role) {
        return next(new ErrorHandler("Role not found", 404));
    }

    res.status(200).json({
        success: true,
        role,
    });
});

// Update Role ---ADMIN
exports.updateRole = asyncErrorHandler(async (req, res, next) => {
    let role = await Role.findById(req.params.id);

    if (!role) {
        return next(new ErrorHandler("Role not found", 404));
    }

    role = await Role.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        role,
    });
});

// Delete Role ---ADMIN
exports.deleteRole = asyncErrorHandler(async (req, res, next) => {
    const role = await Role.findById(req.params.id);

    if (!role) {
        return next(new ErrorHandler("Role not found", 404));
    }

    await role.remove();

    res.status(200).json({
        success: true,
        message: "Role deleted successfully"
    });
});
