const userModel = require("../models/user");
const roleTypeModel = require("../models/roleType");
const mongoose = require("mongoose");

const getUsers = async (req, res) => {
  try {
    const { query } = req;
    const { limit, page, search, sort, status } = query;
    const pageNumber = ((parseInt(page) || 1) - 1) * (limit || 10);
    const limitNumber = parseInt(limit) || 10;
    // get role id
    const role = await roleTypeModel.findOne({
      userType: "user",
    });
    const roleId = await roleTypeModel.findOne({
      userType: "admin",
    });
    // define condition
    let condition = {
      $and: [],
    };
    // set default value for condition
    condition.$and.push({
      isDeleted: false,
    });
    // check for role id
    if (role != null && roleId != null) {
      condition = {
        ...condition,
        $or: [
          {
            roleType: mongoose.Types.ObjectId(role._id),
          },
          {
            roleType: mongoose.Types.ObjectId(roleId._id),
          },
        ],
      };
    }
    // check for search condition
    if (search) {
      condition.$and.push({
        $or: [
          {
            name: {
              $regex: new RegExp(search.trim(), "i"),
            },
          },
          {
            email: {
              $regex: new RegExp(search.trim(), "i"),
            },
          },
        ],
      });
    }
    if (typeof status !== "undefined") {
      condition.$and.push({
        status: status == "1" ? true : false,
      });
    }
    // check for sort option
    let sortOption = {};
    switch (sort) {
      case "createddesc":
        sortOption = {
          createdAt: -1,
        };
        break;
      case "createdasc":
        sortOption = {
          createdAt: 1,
        };
        break;
      case "nasc":
        sortOption = {
          firstName: 1,
          lastName: 1,
        };
        break;
      case "ndesc":
        sortOption = {
          firstName: -1,
          lastName: 1,
        };
        break;
      default:
        sortOption = {
          createdAt: -1,
        };
        break;
    }
    // get user docs
    const userDoc = await userModel.aggregate([
      { $addFields: { name: { $concat: ["$firstName", " ", "$lastName"] } } },
      {
        $match: { ...condition },
      },
      {
        $sort: sortOption,
      },
      {
        $skip: pageNumber,
      },
      {
        $limit: limitNumber,
      },
    ]);
    // get actual result to be sent
    const users = await userModel.populate(userDoc, {
      path: "roleType",
    });
    // get count for the conditions
    const userCount = await userModel.aggregate([
      { $addFields: { name: { $concat: ["$firstName", " ", "$lastName"] } } },
      {
        $match: { ...condition },
      },
      {
        $count: "count",
      },
    ]);
    // sends the response
    return res.status(200).send({
      data: users,
      totalUsers: userCount[0] ? userCount[0].count : 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: error.message,
    });
  }
};
/**
 *
 */
const getUserdetails = async (req, res) => {
  try {
    const { params } = req;
    const { userId } = params;
    // get role id
    const role = await roleTypeModel.findOne({
      userType: new RegExp("^user$", "i"),
    });
    const roleId = await roleTypeModel.findOne({
      userType: new RegExp("admin", "i"),
    });
    let condition = {
      isDeleted: false,
      _id: mongoose.Types.ObjectId(userId),
    };
    // check for role id
    if (role != null && roleId != null) {
      condition = {
        ...condition,
        $or: [
          {
            roleType: mongoose.Types.ObjectId(role._id),
          },
          {
            roleType: mongoose.Types.ObjectId(roleId._id),
          },
        ],
      };
    }
    const user = await userModel.findOne(condition).populate("roleType");
    let data;
    if (user) {
      data = {
        ...user,
        _doc: {
          ...user._doc,
        },
      };
    }
    return res.status(200).send({
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: error.message,
    });
  }
};

/**
 *
 */
 const updateUserStatus = async (req, res) => {
  try {
    const { body } = req;
    const { users, status } = body;
    if (!users || !users.length) {
      return res.status(400).json({
        message: "Id is required for status change.",
        success: false,
      });
    }
    const data = await userModel.updateMany(
      {
        _id: { $in: users },
      },
      {
        $set: {
          status: status,
        },
      }
    );
    for (let x = 0; x < users.length; x++) {
      let result = await userModel
        .findOne({
          _id: users[x],
        })
        .select("firstName middleName lastName email status");
      if (result === null) {
        return res.status(400).json({
          message: "Email not found.",
        });
      }
      const emailVar = new Email(req);
      await emailVar.setTemplate(AvailiableTemplates.STATUS_CHANGE, {
        resetPageUrl: req.headers.host,
        status: result.status === true ? "activated" : "deactivated",
        fullName:
          result.firstName + " " + result.middleName + " " + result.lastName,
      });
      await emailVar.sendEmail(result.email);
    }
    return res.status(200).json({
      message: status
        ? "User activated successfully!"
        : "User deactivated successfully!",
      data,
    });
  } catch (error) {
    console.log("this is get all user error", error);
    return res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
/**
 *
 */
const updateUserDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: commonValidation.formatValidationErr(errors.mapped(), true),
        success: false,
      });
    }
    const { body: $data, params } = req;
    const { userId } = params;
    if ($data.email) {
      let roleType = await roleTypeModel.findOne({
        userType: new RegExp("^user$", "i"),
      });
      let check = await userModel
        .find({
          _id: { $ne: userId },
          email: $data.email,
          isDeleted: false,
        })
        .populate({ path: "roleType" });
      if (check.length) {
        return res.status(400).json({
          message: `Email address already exist${
            check[0] &&
            check[0].roleType &&
            check[0].roleType.userType &&
            roleType &&
            roleType.userType &&
            check[0].roleType.userType !== roleType.userType
              ? ` as ${check[0].roleType.userType}`
              : ""
          }.`,
        });
      }
    }
    let sendMail = false;
    let old_email = "";
    let new_email = $data.email;
    let inserList = {
      ...$data,
      roleType: Mongoose.Types.ObjectId($data.roleType),
      updatedAt: Date.now(),
    };
    let result = await userModel.findOne({
      _id: userId,
    });
    if (result.email !== $data.email) {
      sendMail = true;
      old_email = result.email;
      new_email = $data.email;
    }
    await userModel.findByIdAndUpdate(userId, inserList);
    if (sendMail) {
      const emailVar = new Email(req);
      await emailVar.setTemplate(AvailiableTemplates.EMAIL_CHANGE, {
        resetPageUrl: req.headers.host,
        fullName: $data.firstName + " " + $data.lastName,
        old_email: old_email,
        new_email: new_email,
      });
      await emailVar.sendEmail($data.email);
    }
    return res.status(200).json({
      message: "User details updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
/**
 *
 */
const deleteUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: commonValidation.formatValidationErr(errors.mapped(), true),
        success: false,
      });
    }
    const { params } = req;
    const { userId } = params;
    let inserList = {
      isDeleted: true,
    };
    await userModel.findByIdAndUpdate(userId, inserList);
    let result = await userModel
      .findOne({
        _id: userId,
      })
      .select("firstName middleName lastName email status");
    if (result === null) {
      return res.status(400).json({
        message: "Email not found.",
      });
    }
    const emailVar = new Email(req);
    await emailVar.setTemplate(AvailiableTemplates.STATUS_CHANGE, {
      resetPageUrl: req.headers.host,
      status: "deleted",
      fullName: result.firstName + " " + middleName + " " + result.lastName,
    });
    await emailVar.sendEmail(result.email);
    return res.status(200).json({
      message: "User deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
/**
 *
 */
const proxyLoginToUser = async (req, res) => {
  try {
    const { query } = req;
    const { id } = query;
    const roleType = await roleTypeModel.findOne({
      userType: new RegExp("^user$", "i"),
    });
    const user = await userModel.findOne({
      _id: id,
      roleType: roleType._id,
      isDeleted: false,
    });
    const token = await GenerateToken({
      id: user._id,
      randomKey: generateSalt(10),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      parentId: user.parentId,
      subdomain: user.subdomain,
      role: user.roleType,
    });
    return res.status(200).json({
      responseCode: 200,
      tokenExpire: parseInt(moment().toString()) + 86400,
      token: token,
      subdomain: user.subdomain,
      message: "Successfully Login",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};
/**
 *
 */
const updateUserPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: commonValidation.formatValidationErr(errors.mapped(), true),
        success: false,
      });
    }
    const { body } = req;
    const { newPassword: password, userId } = body;
    let salt = commonCrypto.generateSalt(6);
    body.salt = salt;
    body.password = commonCrypto.hashPassword(body.password, salt);
    await userModel.findByIdAndUpdate(userId, {
      $set: {
        password: body.password,
        salt: body.salt,
      },
    });
    return res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message ? error.message : "Unexpected error occure.",
      success: false,
    });
  }
};

module.exports = {
  getUsers,
  getUserdetails,
};