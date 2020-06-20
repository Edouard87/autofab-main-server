const reservations = require("../../schemas/reservations.js")

module.exports = (req, res) => {
    reservations.findOne({_id: req.params.id, username: req.decoded.username}).then(foundReservation => {
        res.send(foundReservation)
    }).catch((err, doc) => {
        console.log(err)
    })
}