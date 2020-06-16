var users = require("../../schemas/users.js")

module.exports = function (req, res) {

  users.find().then(data => {
    res.send(data)
  })

}