const mongoose = require("mongoose")

var readersSchema = new mongoose.Schema({
  ip: {
    type: String,
    unique: true
  },
  machine: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  }
})

module.exports = new mongoose.model("reader", readersSchema)