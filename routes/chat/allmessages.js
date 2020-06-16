var chats = require("../../schemas/chat.js")

module.exports = function (req, res) {
    chats.findOne({
        _id: req.query.id,
        members: req.decoded.username
      }).then(doc => {
        res.send(doc.messages)
    }).catch(err => {
        console.log(err)
    })
}

