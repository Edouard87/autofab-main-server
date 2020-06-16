const process = require("process")

module.exports = function (req, res) {
  var admin_pages = ["machines", "users", "readers"]
  for (var i = 0; i < admin_pages.length; i++) {
    if (req.params.name == admin_pages[i]) {
      return res.redirect("/a/" + req.params.name)
    }
  }
  console.log("cookies",req.cookies)
  res.render(process.cwd() + "/views/" + req.cookies.interface + "/" + req.params.name + ".ejs", {
    req: req
  })
}