var reservations = require("../../../schemas/reservations.js")
var reservationSets = require("../../../schemas/reservationSets.js") 

module.exports = (req, res) => {
  reservationSets.findById(req.body.reservationSet).then(resSet => {
    var reservation;
    var dataPromises = [];
    for (var i = 0; i < resSet.reject.length; i++) {
      reservation = resSet.reject[i]
      dataPromises.push(reservations.findById(reservation._id).then(doc => {
        doc.status = "rejected"
        doc.actionReason = req.body.actionReason
        doc.save().then(doc => {
        }).catch(err => {
          console.log(err)
        })
      }))
    }
    dataPromises.push(reservations.findById(resSet.approve._id).then(doc => {
      doc.status = "approved"
      doc.save()
    }))
    Promise.all(dataPromises).then(values => {
      console.log(values)
      res.send({
        type: "success",
        header: "Success",
        msg: "The reservation was approved. All conflicting reservations were rejected."
      })
    })
  })
}