const moment = require("moment")
var reservations = require("../../schemas/reservations.js")
var checkConflict = require("../../general_dependencies/checkConflict.js")
var getNumber = require("../../general_dependencies/getNumber.js")

module.exports = function (req, res) {

  var start = moment(req.body.date + ", " + req.body.start, "MM-DD-YYYY, hh:mm A")
  var end = moment(req.body.date + ", " + req.body.end, "MM-DD-YYYY, hh:mm A")
  // make sure the username is the user. An admin does not need to do it this way.
  req.body.username = req.decoded.username

  reservations.find({
    $or: [{
        status: "pending",
        username: req.body.username,
        date: req.body.date
      },
      {
        status: "approved",
        date: req.body.date
      }
    ]
  }).then(doc => {
    console.log("DOC", doc)
    var conflict = checkConflict({
      start: start,
      end: end
    }, doc, req.body.username)
    if (!conflict.isConflict) {
      getNumber((err, conf) => {
        if (err) return console.log(err)
        reservations.create({
          start: start,
          end: end,
          machine: req.body.machine,
          justification: req.body.justification,
          username: req.body.username,
          status: "pending",
          date: req.body.date,
          conf: conf
        }).then((doc) => {
          res.send({
            type: "success",
            header: "Reservation Made",
            msg: "Your reservation has been made.",
            code: 1,
            data: {
              conf: conf
            }
          })
        }).catch((err) => {
          // An error occured (can be with the validation)
          console.log(err)
          if (err.name == "ValidationError") {
            var fields = " "
            for (field in err.errors) {
              if (fields == " ") {
                fields += field
              } else {
                fields += ", " + field
              }
            }
            res.send({
              type: "err",
              header: "Unable to make reservation",
              msg: "Please make sure the following field(s) are filled: " + fields,
              code: 13
            })
          }
        })
      })
    } else {
      // there is a conflict
      res.send({
        type: "success",
        header: "Unable to make your reservation",
        msg: conflict.message
      })
    }
  })

}