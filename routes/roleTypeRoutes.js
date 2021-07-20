const express = require("express");
const router = express.Router();
const roleTypeController = require("../controllers/roleTypeController");
const token = require("../common/token");
const { addRoleTypeValidation } = require("../validations/roleTypeValidation");
// eslint-disable-next-line

router.get(
  "/getAllRoles",
  //token.authorisedUser,
  roleTypeController.getUserAllRole
);

router.post(
  "/addRoleType",
  addRoleTypeValidation,
  //token.authorisedUser,
  roleTypeController.addRoleType
);

module.exports = router;
