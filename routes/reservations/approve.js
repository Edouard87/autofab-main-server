var reservations = require("../../schemas/reservations.js")
var checkConflict = require("../../general_dependencies/checkConflict.js")

module.exports = function (req, res) {

  reservations.findOne({
    _id: req.body._id,
  }).then(doc => {
    if (doc.status != "pending") {
      res.send({
        type: "err",
        header: "Unable to approve",
        msg: "You can only approve pending reservations.",
        code: 10
      })
    } else {
      reservations.find({
        status: "pending"
      }).then(allRes => {
        var conflict = checkConflict(doc, allRes, req.body.username)
        if (conflict.conflicting.excludeSelf.length == 0) {
          doc.status = "approved"
          doc.save().then(() => {
            res.send({
              status: "success",
              msg: "There were no conflicting reservations. It was approved",
              header: "Success!",
              code: 0
            })
          })
        } else {
          for (var i = 0; i < conflict.conflicting.excludeSelf.length; i++) {
            console.log(conflict.conflicting.status)
          }
          reservationSets.create({
            reject: conflict.conflicting.excludeSelf,
            approve: doc
          }).then(set => {
            res.send({
              status: "warn",
              code: 1000,
              data: {
                reservationSet: set._id,
                conflicting: conflict.conflicting.excludeSelf
              }
            })
          }).catch((err, doc) => {
            if (err.code == 11000) {
              console.log("Duplicate Entry")
            }
          })
        }
      })
    }
  })

}