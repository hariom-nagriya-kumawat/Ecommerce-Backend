const { body } = require("express-validator");
const { validationMessage } = require("../common/validationMessage");
const userModel = require("../models/user");
const roleTypeModel = require("../models/roleType");
const normalizeEmail = require("normalize-email");

const signupValidation = [
  body("firstName")
    .not()
    .isEmpty()
    .withMessage(validationMessage.firstName)
    .trim(),
  body("lastName").not().isEmpty().withMessage(validationMessage.lastName),
  body("email", validationMessage.emailValidation)
    .trim()
    .isEmail()
    .withMessage(validationMessage.emailInvalid)
    .custom(async (email, { req }) => {
      const normalizedEmail = normalizeEmail(email);
      const roleType = await roleTypeModel.findOne({
        userType: new RegExp(
          `^${req.body.roleType ? req.body.roleType : "service-seeker"}$`,
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

const signupConfirmation = [
  body("userId").not().isEmpty().withMessage("Please enter User Id.").trim(),
  body("activeValue").not().isEmpty().withMessage("Please enter active value."),
];
const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Email must be a valid.")
    .trim()
    .normalizeEmail(),
  body("password", "Password must be at least 6 character long.")
    .trim()
    .isLength({ min: 6 }),
];
const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Email must be a valid.").trim(),
];
const verifyLinkValidation = [
  body("user").not().isEmpty().withMessage("User field is required.").trim(),
  body("verification")
    .not()
    .isEmpty()
    .withMessage("verification field is required.")
    .trim(),
  body("token").not().isEmpty().withMessage("token field is required.").trim(),
];
const resetPasswordValidation = [
  body("password")
    .not()
    .isEmpty()
    .withMessage("password field is required.")
    .trim(),
];
const updateUserValidation = [
  body("firstName")
    .not()
    .isEmpty()
    .withMessage(validationMessage.firstName)
    .trim(),
  body("lastName").not().isEmpty().withMessage(validationMessage.lastName),
  body("email", validationMessage.emailValidation)
    .trim()
    .isEmail()
    .withMessage(validationMessage.emailInvalid)
    .normalizeEmail(),
  body("roleType").not().isEmpty().withMessage("Role type is required.").trim(),
];
const userChangePasswordValidation = [
  body("oldPassword")
    .not()
    .isEmpty()
    .withMessage("Old password is required.")
    .trim(),
  body("newPassword")
    .not()
    .isEmpty()
    .withMessage("New password is required.")
    .trim(),
];

module.exports = {
  signupValidation,
  signupConfirmation,
  loginValidation,
  forgotPasswordValidation,
  verifyLinkValidation,
  resetPasswordValidation,
  updateUserValidation,
  userChangePasswordValidation,
};
