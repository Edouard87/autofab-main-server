var machines = require("../../schemas/machines.js")

module.exports = function (req, res) {
  machines.find({}).then(data => {
    res.send(data)
  })
}