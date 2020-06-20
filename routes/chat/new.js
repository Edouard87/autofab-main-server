var chats = require("../../schemas/chat.js")
var users = require("../../schemas/users.js")
var createChat = require("./create.js")

module.exports = (req, res) => {

  req.body.owner = req.decoded.username
  createChat(req.body, function() {
    res.send({
      msg: "Your new chat has been created!",
      header: "Success"
    })
  }, function(err, doc) {
    console.log(err)
  })
 
}

