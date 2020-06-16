const mongoose = require("mongoose")

var timetableSchema = new mongoose.Schema({
  name: String,
  days: Object,
  active: Boolean
})

timetableSchema.pre('save', function (next) {
  if (this.name === null || this.name === undefined || this.name === "") {
    this.name = 'Timetable';
  }
  if (this.active === null || this.active === undefined || this.active === "") {
    this.active = false
  }
  next();
});

module.exports = mongoose.model("timetable", timetableSchema)