const reservations = require("../../../schemas/reservations.js")

module.exports = function (req, res) {
  reservations.find(req.body).then(data => res.send(data)).catch(err => console.log(err))
}