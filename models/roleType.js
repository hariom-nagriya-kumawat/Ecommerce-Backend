const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roleSchema = new Schema({
  userType: {
    type: String,
    default: null,
  },
  status: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model("roleType", roleSchema);
