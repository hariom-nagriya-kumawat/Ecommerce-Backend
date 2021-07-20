const roleTypeModel = require("../models/roleType");
const { validationResult } = require("express-validator");
const commonValidation = require("../common");
const { otherMessage } = require("../common/validationMessage");

/* -------------Get All Roles------------ */
const getUserAllRole = async (req, res) => {
  try {
    const { query } = req;
    let language = query && query.language ? query.language : "en";
    const getAllRoles = await roleTypeModel.find();
    if (getAllRoles) {
      return res.status(200).json({
        responsecode: 200,
        message: otherMessage.getAllRoleType,
        data: getAllRoles,
        success: true,
      });
    } else {
      return res.status(400).json({
        responsecode: 400,
        message: "No role found",
        success: false,
      });
    }
  } catch (error) {
    console.log("This is get all rolesType error.", error);
    return res.status(400).send({ message: error });
  }
};
/* -------------Get All Roles End------------ */

/* -------------Add Roles Type Start------------ */
const addRoleType = async (req, res) => {
  try {
    const { body, query } = req;
    let language = query && query.language ? query.language : "en";
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: commonValidation.formatValidationErr(errors.mapped(), true),
        success: false,
      });
    }
    let result = await roleTypeModel(body).save();
    if (result) {
      return res.status(200).json({
        message: otherMessage.addRoleType,
        user: result._id,
        success: true,
      });
    }
  } catch (error) {
    console.log("This is add rolesType error.", error);
    return res.status(400).send({ message: error });
  }
};
/* -------------Add Roles Type End------------ */

module.exports = {
  getUserAllRole,
  addRoleType,
};
