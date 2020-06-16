var users = require("../../schemas/users.js")

module.exports = (req, res) => {
  users.findOneAndUpdate({
    _id: req.body.id
  }, req.body).exec().then(doc => {
    res.send({
      type: "success",
      header: "Changes Saved Successfully",
      msg: "User " + doc.username + "'s profile was updated successfully."
    })
  }).catch((err) => {
    res.send({
      type: "err",
      header: "Your changes could not be saved.",
      msg: "There was a problem editing user " + req.body.username + "'s profile. Please make sure you supply a unique username and RFID tag."
    })
  })
}