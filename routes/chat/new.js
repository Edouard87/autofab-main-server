var chats = require("../../schemas/chat.js")
var users = require("../../schemas/users.js")

module.exports = (req, res) => {

  req.body.members = new Array();

  users.find({permission: -1}).then(adminUsers => {
    adminUsers.forEach(adminUser => {
      req.body.members.push(adminUser.username)
    })
    req.body.members.push(req.decoded.username)
     req.body.owner = req.decoded.username
     chats.create(req.body).then(doc => {
       res.send({
         msg: "Your new chat has been created!",
         header: "Success"
       })
     }).catch((err, doc) => {
       console.log(err)
     })

  })

 
}

