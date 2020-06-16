var machines = require("../../schemas/machines.js")

module.exports = function (req, res) {

  console.log("Machine", req.body)

  machines.create(req.body).then(() => {
    res.send({
      type: "success",
      header: "Success",
      msg: "Machine " + req.body.name + ", which is a " + req.body.type + " was created successfully."
    })
  }).catch(err => {
    res.send({
      type: "err",
      header: "Failed to create machine",
      msg: "An unknown error occured."
    })
    console.log(err)
  });


}