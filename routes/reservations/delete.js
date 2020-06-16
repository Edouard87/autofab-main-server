const isAdmin = require("../../middleware_functions/isAdmin.js")
var reservations = require("../../schemas/reservations.js")

module.exports = (req, res) => {
  if (isAdmin(req)) {
    reservations.findByIdAndDelete({
      _id: req.body.id
    }).exec().then((document) => {
      res.send({
        type: "success",
        header: "Success",
        msg: "The resrevation was successfully deleted. It will not longer take place"
      })
    }).catch((err) => {
      console.log(err)
      res.send({
        type: "error",
        header: "Error",
        msg: "An error occured"
      })
    })
  } else {
    reservations.findOneAndDelete({
      username: req.decoded.username,
      _id: req.body.resId
    }).exec().then((document) => {
      res.send({
        type: "success",
        header: "Success",
        msg: "The reservation was successfully deleted. It will not longer take place"
      })
    }).catch((err) => {
      res.send({
        type: "error",
        header: "Error",
        msg: "An error occured"
      })
    })
  }

}