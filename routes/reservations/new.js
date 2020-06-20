const moment = require("moment")
var reservations = require("../../schemas/reservations.js")
var checkConflict = require("../../general_dependencies/checkConflict.js")
var getNumber = require("../../general_dependencies/getNumber.js")
var createChat = require("../../routes/chat/create.js")
var machines = require("../../schemas/machines.js")

module.exports = function (req, res) {

  var start = moment(req.body.date + ", " + req.body.start, "MM-DD-YYYY, hh:mm A")
  var end = moment(req.body.date + ", " + req.body.end, "MM-DD-YYYY, hh:mm A")
  // make sure the username is the user. An admin does not need to do it this way.
  req.body.username = req.decoded.username

  // The new AutoFab AutoRes 2 reservation algorithm

  reservations.find({status: 0}).then(doc => {
    console.log("Found", doc)
    console.log("DOC", doc)
    var conflict = checkConflict({
      start: start,
      end: end
    }, doc, req.body.username)
    if (!conflict.isConflict) {
      getNumber((err, conf) => {
        if (err) return console.log(err)
        machines.findById(req.body.machine).then(selectedMachine => {
          reservations.create({
            start: start,
            end: end,
            machine: req.body.machine,
            justification: req.body.justification,
            username: req.body.username,
            status: selectedMachine.default_status,
            date: req.body.date,
            conf: conf
          }).then((doc) => {
            createChat({
              title: "Reservation on " + moment(req.body.date, "mm-dd-yyyy").format("dddd, MMMM Do YYYY"),
              link: doc._id,
              description: "This is a linked reservation chat so that you can track the status of your reservation.",
              owner: req.decoded.username,
            }, function(createdChat) {
              // success
              createdChat.messages.push({
                type: 1,
                data: doc,
                owner: req.decoded.username,
                time: Date.now,
                date: moment().format("mm-dd-yyyy"),
                read: false,
              })
              createdChat.messages.push({
                type: 0,
                data: "Justification for this reservation: " + req.body.justification,
                owner: req.decoded.username,
                time: (new Date()).getTime(),
                date: moment().format("MM-DD-YYYY"),
                read: false
            })
              createdChat.save().then(savedDoc  => {
                res.send({
                  type: "success",
                  header: "Reservation Made",
                  msg: "Your reservation has been made.",
                  code: 1,
                  data: {
                    conf: conf
                  }
                })
              }).catch((err, savedDoc) => {
                console.log(err)
              })
              
            }, function(err, doc) {
              // fail
              console.log(err)
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
        }).catch(err => console.log(err))
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