const express = require("express");
const router = express.Router();
const { roleType, auth, user } = require("./index");

router.use("/roleType", roleType);
router.use("/auth", auth);
router.use("/user", user);

module.exports = router;
