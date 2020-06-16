const jwt = require("jsonwebtoken")
var users = require("../../schemas/users.js")
var hmacPass = require("../../general_dependencies/hmacPass.js") 

module.exports = function (req, res) {
  users.findOne({
    username: req.body.username
  }).then(data => {
    if (data == null) {
      // no user exists
      res.send({
        type: "err",
        header: "Login Failed",
        msg: "No user exists with that username.",
        code: 11
      })
    } else {
      if (hmacPass(req.body.password) == data.password) {
        // password is correct
        const token = jwt.sign({
          username: req.body.username,
          permission: data.permission
        }, 'hgfhjnbghj');
        res.cookie("auth", token);
        res.send({
          code: 0
        })
      } else {
        // password is incorrect
        res.send({
          code: 12
        })
      }
    }
  })
}