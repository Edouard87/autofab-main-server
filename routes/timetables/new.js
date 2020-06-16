var timetables = require("../../schemas/timetables.js")

module.exports = (req, res) => {
  console.log("creating!")
  console.log(req.body)
  if (req.body._id == "new") {
    delete req.body._id
  }
  timetables.create(req.body).then(doc => {
    res.send({
      code: 1,
      header: "Timetable Saved",
      msg: "Your timetable was saved."
    })
    console.log("created: ", doc)
  }).catch((err, doc) => {
    console.log(err)
  })
}