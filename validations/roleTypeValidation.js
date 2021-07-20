const { body } = require("express-validator");
const { validationMessage } = require("../common/validationMessage");

const addRoleTypeValidation = [
  body("userType")
    .not()
    .isEmpty()
    .withMessage(validationMessage.addUserType)
    .trim(),
];

module.exports = {
  addRoleTypeValidation,
};
