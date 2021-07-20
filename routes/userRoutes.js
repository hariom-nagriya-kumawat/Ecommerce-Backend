const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const token = require("../common/token");
const { addRoleTypeValidation } = require("../validations/roleTypeValidation");
// eslint-disable-next-line

router.get(
  "/user-list",
  //token.authorisedUser,
  userController.getUsers
);

router.get("/:userId", userController.getUserdetails);

module.exports = router;
