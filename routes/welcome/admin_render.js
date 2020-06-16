const process = require("process")

module.exports = function (req, res) {
  res.render(process.cwd() + "/views/" + req.cookies.interface + "/" + req.params.name + ".ejs", {
    req: req
  })
}