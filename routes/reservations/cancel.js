var reservations = require("../../schemas/reservations.js")
var isAdmin = require("../../middleware_functions/isAdmin.js")

module.exports = (req, res) => {

  console.log("BODY", req.body)
  console.log("_ID", req.body._id)

  var query;
  var no = ["rejected"]

  if (isAdmin(req)) {
    query = {
      _id: req.body._id,
    }
  } else {
    query = {
      _id: req.body._id,
      username: req.decoded.username
    }
  }
  reservations.findOne(query).then((doc) => {
    doc.status = "canceled"
    doc.save()
    if (no.includes(doc.status)) {
      res.send({
        type: "err",
        header: "Cannot cancel",
        msg: "You cannot cancel this reservation"
      })
    } else {
      res.send({
        type: "success",
        header: "Reservation Cancelled",
        msg: "Your reservation will no longer be taking place"
      })
    }
  })

}