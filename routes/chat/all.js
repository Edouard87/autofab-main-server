var chats = require("../../schemas/chat.js")
var isAdmin = require("../../middleware_functions/isAdmin.js")

module.exports = (req, res) => {
  var query;
  if (!isAdmin(req)) {
    query = {
      members: req.decoded.username
    }
  } else if (isAdmin(req) && req.query.show == "all") {
    query = {}
  } else {
    query = {
      members: req.decoded.username
    }
  }
  chats.find(query).then(docs => {
    res.send(docs)
  }).catch(err => {
    console.log(err)
  })
}


