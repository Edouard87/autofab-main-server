var timetables = require("../../schemas/timetables.js")

module.exports = (req, res) => {
  console.log("Body", req.body)
  timetables.findOneAndUpdate({
    _id: req.body._id
  }, req.body).then(doc => {
    console.log("Original", doc)
    res.send({
      code: 1,
      header: "Changes saved",
      msg: "Your chnages to this time table have been saved successfully."
    })
  }).catch(err => {
    console.log(err)
  })
}