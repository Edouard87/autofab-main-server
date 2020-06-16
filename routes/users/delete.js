var users = require("../../schemas/users.js")

module.exports = (req, res) => {
  users.findByIdAndDelete(req.body.id).exec().then(doc => {
    res.send({
      type: "success",
      header: "Success",
      msg: "User successfully deleted."
    })
  })
}