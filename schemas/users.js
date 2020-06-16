const mongoose = require("mongoose")

var userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  permission: {
    type: Number,
    required: true
  },
  rfid: {
    type: String,
    unique: true,
    required: true
  }
})

module.exports = mongoose.model("User", userSchema);