var chats = require("../../schemas/chat.js")
var moment = require("moment")

module.exports = function (req, res) {
    console.log(req.body._id)
    chats.findOne({_id: req.body._id, members: req.decoded.username}).then(doc => {
        console.log(doc)
        doc.messages.push({
            type: 0,
            data: req.body.message,
            owner: req.decoded.username,
            time: (new Date()).getTime(),
            date: moment().format("MM-DD-YYYY"),
            read: false
        })
        doc.save().then(doc => {
            console.log("message emitted")
            res.status(200)
            res.end()
        })
    })
}
