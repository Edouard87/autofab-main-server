var users = require("../schemas/users.js")

module.exports = function() { users.find().then(doc => {
  if (doc.length == 0) {
    users.create({
      username: "admin",
      password: hmacPass("admin"),
      permission: -1,
      rfid: 1
    })
  }
})}