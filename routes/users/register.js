var users = require("../../schemas/users.js")

module.exports = function (req, res) {
  users.create({
    username: req.body.username,
    password: hmacPass(req.body.password),
    permission: req.body.permission,
    rfid: req.body.rfid
  }).then(() => {
    res.send({
      type: "success",
      header: "User Created",
      msg: "User " + req.body.username + " was created."
    })
  }).catch((err) => {
    res.send({
      type: "err",
      header: "Failed to create user",
      msg: "User " + req.body.username + " could not be created. Please make sure you supply a unique username and RFID tag."
    })
  })
}