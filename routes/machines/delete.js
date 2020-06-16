var machines = require("../../schemas/machines.js")

module.exports = function (req, res) {

  machines.findByIdAndRemove(req.body.id).exec().then((err, data) => {
    res.send({
      type: "success",
      header: "Success",
      msg: "Machine successfully deleted."
    })
  })

}