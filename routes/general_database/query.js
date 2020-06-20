var isAdmin = require("../../middleware_functions/isAdmin.js")
var users = require("../../schemas/users.js")
var machines = require("../../schemas/machines.js")
var reservations = require("../../schemas/reservations.js")
var reservationSets = require("../../schemas/reservationSets.js")
var timetables = require("../../schemas/timetables.js")
var readers = require("../../schemas/readers.js")

module.exports = (req, res) => {
  var studentAllowed = ["machines", "reservations"]
  if ((!isAdmin(req)) && (!(studentAllowed.includes(req.params.collection)))) {
    console.log("UNAUTHORIZED")
    res.send({
      code: 14
    })
  } else {
    try {
      eval(req.params.collection).find(req.query).then(docs => {
        res.send(docs)
      }).catch((err, doc) => {
        console.log(err)
      })
    } catch (err) {
      console.log(err)
    }
  }

}