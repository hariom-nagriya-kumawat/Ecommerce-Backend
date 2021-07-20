const express = require("express");
const router = express.Router();
const token = require("../common/token");
const authController = require("../controllers/authController");
const {
  signupValidation,
  signupConfirmation,
  loginValidation,
  forgotPasswordValidation,
  verifyLinkValidation,
  resetPasswordValidation,
  userChangePasswordValidation,
  updateUserValidation,
} = require("../validations/authValidation");

// eslint-disable-next-line
router.post("/signUp", signupValidation, authController.signUp);
router.post(
  "/resend-confirmation",
  signupValidation,
  authController.resendConfirmationLink
);
router.post(
  "/confirmation",
  signupConfirmation,
  authController.confirmationSignUp
);
router.post("/login", loginValidation, authController.loginApp);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  authController.userForgotPassword
);
router.post(
  "/verify-link",
  verifyLinkValidation,
  authController.userVerifyLink
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  authController.userResetpassword
);
router.post(
  "/change-password",
  token.authorisedUser,
  userChangePasswordValidation,
  authController.changePasswordUser
);
router.put(
  "/update-user",
  token.authorisedUser,
  updateUserValidation,
  authController.updateUserData
);
router.get("/get-profile", token.authorise, authController.getProfile);

module.exports = router;
