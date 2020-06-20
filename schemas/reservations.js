const mongoose = require("mongoose")

var reservationSchema = new mongoose.Schema({
  createdAt: Number,
  updatedAt: Number,
  start: {
    type: Number,
    required: true
  },
  end: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  machine: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  actionReason: String,
  conf: Number
}, {
  timestamps: {
    currentTime: () => Date.now()
  }
})

module.exports = mongoose.model("reservation", reservationSchema)