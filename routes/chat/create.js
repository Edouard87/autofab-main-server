var chats = require("../../schemas/chat.js")
var users = require("../../schemas/users.js")

module.exports = (data, success, error) => {
 
  data.members = new Array();
  data.messages = new Array();
  users.find({permission: -1}).then(adminUsers => {
      console.log(adminUsers)
    adminUsers.forEach(adminUser => {
      data.members.push(adminUser.username)
    })
    data.members.push(data.owner)
     chats.create(data).then(doc => {
       success(doc)
     }).catch((err, doc) => {
       error(err, doc)
     })

  })

 
}