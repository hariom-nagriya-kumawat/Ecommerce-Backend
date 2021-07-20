const jwt = require("jsonwebtoken");
const userModel = require("../models/user");
const roleTypeModel = require("../models/roleType");
const { validationResult } = require("express-validator");
const commonValidation = require("../common");
const commonSmtp = require("../common/index");
const commonCrypto = require("../common/crypto");
const { otherMessage } = require("../common/validationMessage");
const { Email, AvailiableTemplates } = require("../common/Email");
const moment = require("moment");
const mongoose = require("mongoose");

const signUp = async (req, res) => {
  try {
    const { query } = req;
    let language = query && query.language ? query.language : "en";
    const confirmationNumber = new Date().valueOf();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: commonValidation
          .formatValidationErr(errors.mapped(), true)
          .replace("<br>", " "),
        success: false,
      });
    }
    const roleType = await roleTypeModel.findOne({
      userType: new RegExp(
        `^${req.body.roleType ? req.body.roleType : "user"}$`,
        "i"
      ),
    });
    let data = req.body;
    data.roleType = roleType._id;
    data.firstTimeUser = true;
    data.loggedInIp = commonSmtp.getIpAddress(req);
    var salt = commonCrypto.generateSalt(6);
    data.salt = salt;
    data.password = commonCrypto.hashPassword(data.password, salt);
    data.userSideActivationValue = confirmationNumber;
    let result = await userModel(data).save();
    const emailVar = new Email(req);
    await emailVar.setTemplate(
      language === "en"
        ? AvailiableTemplates.SIGNUP_CONFIRMATION
        : AvailiableTemplates.SIGNUP_CONFIRMATION_ARABIC,
      {
        firstName: result.firstName,
        middleName: result.middleName,
        lastName: result.lastName,
        email: result.email,
        userId: result._id,
        userSideActivationValue: confirmationNumber,
      }
    );
    await emailVar.sendEmail(result.email);
    return res.status(200).json({
      responsecode: 200,
      message: otherMessage.confirmMessage,
      user: result._id,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
/* Resend Cofirmation Link */
const resendConfirmationLink = async (req, res) => {
  try {
    const { query } = req;
    let language = query && query.language ? query.language : "en";
    let {
      firstName,
      middleName,
      lastName,
      email,
      _id,
      userSideActivationValue,
      userSideActivation,
    } = await userModel.findById(req.body.id);
    if (userSideActivation === false && userSideActivationValue !== "") {
      const emailVar = new Email(req);
      await emailVar.setTemplate(
        language === "en"
          ? AvailiableTemplates.SIGNUP_CONFIRMATION
          : AvailiableTemplates.SIGNUP_CONFIRMATION_ARABIC,
        {
          userId: _id,
          firstName,
          middleName,
          lastName,
          email,
          userSideActivationValue,
        }
      );
      await emailVar.sendEmail(email);
      return res.status(200).json({
        responsecode: 200,
        message:
          language === "en"
            ? otherMessage.confirmMessage
            : otherMessageArabic.confirmMessage,
        user: _id,
        success: true,
      });
    } else {
      return res.status(200).json({
        message: "You have already confirmed your account.",
        user: _id,
        success: true,
      });
    }
  } catch (error) {}
};
/*  */
const confirmationSignUp = async (req, res) => {
  try {
    const { query } = req;
    let language = query && query.language ? query.language : "en";
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: commonValidation.formatValidationErr(errors.mapped(), true),
        success: false,
      });
    }
    let data = req.body;
    var userData = await userModel.findOne({
      $and: [
        { _id: data.userId },
        { userSideActivation: false },
        { userSideActivationValue: data.activeValue },
      ],
    });
    if (userData) {
      let userUpdate = await userModel.updateOne(
        {
          _id: userData._id,
        },
        {
          $set: {
            userSideActivation: true,
            userSideActivationValue: "",
          },
        }
      );
      if (userUpdate) {
        const emailVar = new Email(req);
        await emailVar.setTemplate(AvailiableTemplates.SIGNUP, {
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
        await emailVar.sendEmail(userData.email);
        res.status(200).json({
          responsecode: 200,
          data: userData,
          message: "Confirmation link verfied successfully.",
          success: true,
        });
      } else {
        res.status(401).json({
          message: "Some thing Went Wrong",
          success: false,
        });
      }
    } else {
      res.status(401).json({
        message: "User already exist.",
        success: false,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
const loginApp = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { query } = req;
    let language = query && query.language ? query.language : "en";
    const result = await userModel
      .findOne({
        $and: [
          { normalizedEmail: email },
          { $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }] },
          // {
          //   $or: [
          //     {
          //       roleType: await roleTypeModel.findOne({
          //         userType: "service-seeker",
          //       }),
          //     },
          //     {
          //       roleType: await roleTypeModel.findOne({
          //         userType: "service-provider",
          //       }),
          //     },
          //   ],
          // },
        ],
      })
      .populate("roleType");
    if (result === null) {
      // eslint-disable-next-line no-throw-literal
      throw {
        code: 400,
        message: "Please enter valid email or password.",
        success: false,
      };
    }
    if (!result.status) {
      // eslint-disable-next-line no-throw-literal
      throw {
        code: 400,
        message:
          "Your account access has been deactivated from the Admin,Please contact the Administrator.",
        success: false,
      };
    }
    if (!result.userSideActivation) {
      // eslint-disable-next-line no-throw-literal
      throw {
        code: 400,
        message: "Kindly Verify your Account and try to Login.",
        success: false,
      };
    }
    if (!commonCrypto.verifyPassword(result.password, password, result.salt)) {
      // eslint-disable-next-line no-throw-literal
      throw {
        code: 400,
        message: "Please enter correct email or password.",
        success: false,
      };
    }
    await userModel.updateOne(
      {
        _id: result._id,
      },
      {
        $set: {
          loggedInIp: commonSmtp.getIpAddress(req),
          loggedInAt: new Date(),
        },
      }
    );
    var token = jwt.sign(
      {
        id: result._id,
        randomKey: commonCrypto.generateSalt(8),
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      },
      commonCrypto.secret,
      {
        expiresIn: 86400,
      }
    );
    return res.status(200).json({
      responseCode: 200,
      data: result,
      tokenExpire: moment() + 86400,
      token: token,
      roleType:
        result && result.roleType && result.roleType.userType
          ? result.roleType.userType
          : "",
      message: "Successfully Login.",
      success: true,
    });
  } catch (error) {
    res.status(error.code || 500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
/* -----------------User Forgot Password-------------- */
const userForgotPassword = async (req, res) => {
  const { body, query } = req;
  let language = query && query.language ? query.language : "en";
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: commonValidation.formatValidationErr(errors.mapped(), true),
      success: false,
    });
  }
  try {
    const userData = await userModel.findOne({
      $and: [
        { email: body.email },
        {
          $or: [
            {
              roleType: await roleTypeModel.findOne({
                userType: "service-seeker",
              }),
            },
            {
              roleType: await roleTypeModel.findOne({
                userType: "service-provider",
              }),
            },
          ],
        },
      ],
    });
    if (!userData) {
      return res.status(400).json({
        responsecode: 400,
        message: "Email not registered with us.",
        success: false,
      });
    }
    const encryptedUserId = commonCrypto.encrypt(userData.id);
    const encrypteUserEmail = commonCrypto.encrypt(userData.email);
    const encrypteVerifyToken = commonCrypto.encrypt(
      userData.email + userData.id
    );
    const emailVar = new Email(req);
    await emailVar.setTemplate(AvailiableTemplates.FORGET_PASSWORD, {
      resetPageUrl: req.headers.host,
      fullName:
        userData.firstName +
        " " +
        userData.middleName +
        " " +
        userData.lastName,
      onResetPopupShow: true,
      email: encrypteUserEmail,
      userId: encryptedUserId,
      verifyToken: encrypteVerifyToken,
    });
    await userModel.update(
      {
        email: userData.email,
      },
      {
        verifyToken: encrypteVerifyToken,
      }
    );
    await emailVar.sendEmail(body.email);
    return res.status(200).json({
      responseCode: 200,
      message:
        "Reset password link have been send successfully to your registered email address.",
      success: true,
    });
  } catch (error) {
    console.log("this is forgot password error", error);
    return res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
/* -----------------User Verify Link-------------- */
const userVerifyLink = async (req, res) => {
  const { body, query } = req;
  let language = query && query.language ? query.language : "en";
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: commonValidation.formatValidationErr(errors.mapped(), true),
      success: false,
    });
  }
  try {
    const decryptedUserId = commonCrypto.decrypt(body.verification);
    const decryptedUserEmail = commonCrypto.decrypt(body.user);
    const userData = await userModel.findOne({
      email: decryptedUserEmail,
      _id: decryptedUserId,
      verifyToken: body.token,
    });
    if (!userData) {
      return res.status(400).json({
        responsecode: 400,
        message: "Your session has been expired.",
        success: false,
      });
    }
    return res.status(200).json({
      responseCode: 200,
      message: "Link verified successfully!",
      data: userData,
      success: true,
    });
  } catch (error) {
    console.log("this is verify link error", error);
    return res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};

/* -----------------User Reset password-------------- */
const userResetpassword = async (req, res) => {
  const { body, query } = req;
  let language = query && query.language ? query.language : "en";
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: commonValidation.formatValidationErr(errors.mapped(), true),
      success: false,
    });
  }
  try {
    const decryptedUserEmail = commonCrypto.decrypt(body.user);
    const userData = await userModel.findOne({
      $and: [
        { email: decryptedUserEmail },
        {
          $or: [
            {
              roleType: await roleTypeModel.findOne({
                userType: "service-seeker",
              }),
            },
            {
              roleType: await roleTypeModel.findOne({
                userType: "service-provider",
              }),
            },
          ],
        },
      ],
    });
    if (!userData) {
      return res.status(400).json({
        responsecode: 400,
        message: "Email not registered.",
        success: false,
      });
    }
    var salt = commonCrypto.generateSalt(6);
    body.salt = salt;
    const encryptedUserpassword = commonCrypto.hashPassword(
      body.password,
      salt
    );
    if (!userData.verifyToken) {
      return res.status(400).json({
        responsecode: 400,
        message: "Your session has been expired.",
        success: false,
      });
    }
    const result = await userModel.findByIdAndUpdate(
      {
        _id: userData.id,
      },
      {
        $set: {
          password: encryptedUserpassword,
          salt: body.salt,
          verifyToken: null,
        },
      }
    );
    if (result) {
      return res.status(200).json({
        responseCode: 200,
        message: "Password updated successfully!",
        success: true,
      });
    } else {
      return res.status(400).json({
        responsecode: 400,
        message: "Your session has been expired.",
        success: false,
      });
    }
  } catch (error) {
    console.log("this is Reset password error", error);
    return res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};

/* Change password user*/
const changePasswordUser = async (req, res) => {
  const { body, currentUser, query } = req;
  let language = query && query.language ? query.language : "en";
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: commonValidation.formatValidationErr(errors.mapped(), true),
      success: false,
    });
  }
  try {
    const userData = await userModel.findById(currentUser.id);
    if (
      !commonCrypto.verifyPassword(
        userData.password,
        body.oldPassword,
        userData.salt
      )
    ) {
      // eslint-disable-next-line no-throw-literal
      throw {
        code: 400,
        message: "Old password did not match!",
        success: false,
      };
    } else {
      var salt = commonCrypto.generateSalt(6);
      body.salt = salt;
      body.newPassword = commonCrypto.hashPassword(body.newPassword, salt);
      const result = await userModel.findByIdAndUpdate(currentUser.id, {
        $set: {
          password: body.newPassword,
          salt: body.salt,
        },
      });
      if (result) {
        return res.status(200).json({
          responseCode: 200,
          message: "Password updated successfully!",
          success: true,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
const updateUserData = async (req, res) => {
  try {
    const { query } = req;
    let language = query && query.language ? query.language : "en";
    let data = req.body;
    let currentUser = req.currentUser;
    let inserList = {
      ...data,
      updatedAt: Date.now(),
    };
    let result = await userModel.findByIdAndUpdate(currentUser.id, inserList);
    return res.status(200).json({
      responseCode: 200,
      message: otherMessage.updateUserDataMessage,
      data: result,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
/* get single user info*/
const getProfile = async (req, res) => {
  try {
    const { currentUser, query } = req;
    let language = query && query.language ? query.language : "en";
    let result = await userModel
      .findOne({
        _id: currentUser.id,
        $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }],
      })
      .populate("roleType")
      .select("firstName lastName middleName email phone profileImg roleType");
    if (result) {
      return res.status(200).json({
        responseCode: 200,
        data: result,
        success: true,
      });
    } else {
      return res.status(401).json({
        responseCode: 401,
        message: otherMessage.userNotExist,
        success: false,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};

module.exports = {
  signUp,
  resendConfirmationLink,
  confirmationSignUp,
  loginApp,
  userForgotPassword,
  userVerifyLink,
  userResetpassword,
  changePasswordUser,
  updateUserData,
  getProfile,
};
