const { body } = require("express-validator");
const Mongoose = require("mongoose");
const { validationMessage } = require("../common/validationMessage");
const userModel = require("../models/user");
const roleTypeModel = require("../models/roleType");
const normalizeEmail = require("normalize-email");
const updateUserValidation = [
  body("firstName")
    .not()
    .isEmpty()
    .withMessage("Please enter first name.")
    .trim(),
  body("lastName").not().isEmpty().withMessage("Please enter last name."),
  body("email").trim().isEmail().withMessage("Please enter valid email."),
  body("roleType").not().isEmpty().withMessage("Role type is required.").trim(),
];
const updateUserPasswordValidations = [
  body("newPassword")
    .not()
    .isEmpty()
    .withMessage("Please enter new password.")
    .trim(),
  body("userId")
    .not()
    .isEmpty()
    .withMessage("Please provide user id to update.")
    .custom((userId) => {
      Mongoose.Types.ObjectId(userId);
      return true;
    }),
];
const addEmployeeValidation = [
  body("firstName")
    .not()
    .isEmpty()
    .withMessage(validationMessage.firstName)
    .trim(),
  body("roleType")  
  .not()
  .isEmpty()
  .withMessage("Role type is required."),
  body("email", validationMessage.emailValidation)
    .trim()
    .isEmail()
    .withMessage(validationMessage.emailInvalid)
    .custom(async (email, { req }) => {
      const normalizedEmail = normalizeEmail(email);
      const roleType = await roleTypeModel.findOne({
        userType: new RegExp(
          `^${req.body.roleType ? req.body.roleType : "order-regulator"}$`,
          "i"
        ),
      });
      const result = await userModel
        .findOne({
          $and: [
            { normalizedEmail: normalizedEmail },
            { $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }] },
          ],
        })
        .populate({ path: "roleType" });
      if (result) {
        throw new Error(
          `Email address already exist${
            result &&
            result.roleType &&
            result.roleType.userType &&
            roleType &&
            roleType.userType &&
            result.roleType.userType !== roleType.userType
              ? ` as ${result.roleType.userType}`
              : ""
          }.`
        );
      }
      req.body.normalizedEmail = normalizedEmail;
      return true;
    }),
  body("password")
    .not()
    .isEmpty()
    .withMessage(validationMessage.passwordValidation)
    .trim()
    .isLength({ min: 6 })
    .withMessage(validationMessage.minimumPasswordValidation),
];
module.exports = {
  updateUserValidation,
  updateUserPasswordValidations,
  addEmployeeValidation
};
