var checkConflict = require("../../general_dependencies/checkConflict.js")
var reservations = require("../../schemas/reservations.js")

module.exports = function(req, res) {
    console.log("TRIGGERED", req.body)
    reservations.find({date: req.body.date}).then(allReservations => {
        console.log("All Reservations",allReservations)
        var conflicting = checkConflict(req.body,allReservations,req.decoded.username)
        if (conflicting.isConflict) {
            res.send({
                header: "Unable to change",
                msg: "This reservation conflicts with another. Please try a different date or time"
            })
        } else {
            console.log("no conflict")
            res.end()
        }
    })
}