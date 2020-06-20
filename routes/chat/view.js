const chats = require("../../schemas/chat.js")

module.exports = (req, res) => {
    chats.find({_id: req.params.id, members: req.decoded.username}).then(doc => {
        res.send(doc)
    }).catch((doc, err) => {
        console.log(err)
    })
}