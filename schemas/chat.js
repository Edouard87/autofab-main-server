const mongoose = require("mongoose")

var chatSchema = new mongoose.Schema({
  messages: Array,
  link: String,
  title: String,
  description: String,
  owner: String,
  members: Array
})

module.exports = mongoose.model("chat", chatSchema)

