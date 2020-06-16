const mongoose = require("mongoose")

var machineSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: String
})

module.exports = mongoose.model("machine", machineSchema)