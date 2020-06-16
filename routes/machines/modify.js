var machines = require("../../schemas/machines.js")

module.exports = (req, res) => {
  machines.findOneAndUpdate({
    _id: req.body.id
  }, req.body).exec().then(doc => {
    res.send({
      type: "success",
      header: "Changes Saved",
      msg: "The machine was updated"
    }).catch((doc, err) => {
      console.log(err)
    })
  })
}