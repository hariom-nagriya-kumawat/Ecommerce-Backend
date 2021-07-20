const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
  firstName: {
    type: String,
    default: null,
  },
  middleName: {
    type: String,
    default: null,
  },
  lastName: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    required: true,
  },
  normalizedEmail: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    default: null,
  },
  profileImg: {
    type: String,
    default: "",
  },
  verifyToken: {
    type: String,
    default: null,
  },
  roleType: {
    type: Schema.Types.ObjectId,
    ref: "roleType",
    required: true,
  },
  firstTimeUser: {
    type: Boolean,
    default: false,
  },
  userSideActivation: {
    type: Boolean,
    default: false,
  },
  userSideActivationValue: {
    type: String,
    default: null,
  },
  status: {
    type: Boolean,
    default: true,
  },
  salt: {
    type: String,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  dob: {
    type: Date,
    default: Date.now,
  },
  loggedInIp: {
    type: String,
    default: null,
  },
  loggedInAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("user", userSchema);
