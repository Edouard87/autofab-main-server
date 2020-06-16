const mongoose = require("mongoose")

var reservationSetSchema = new mongoose.Schema({
  createdAt: Number,
  updatedAt: Number,
  reject: {
    type: Array
  },
  approve: {
    type: Object
  }
}, {
  timestamps: {
    currentTime: () => Math.floor(Date.now() / 1000)
  }
})

module.exports = mongoose.model("reservationSet", reservationSetSchema)