const reservationSets = require("../../../schemas/reservationSets.js")

module.exports = (req, res) => {
  reservationSets.findById(req.params.id).then(doc => {
    res.send(doc.reject)
  })
}