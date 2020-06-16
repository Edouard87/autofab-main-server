var isAdmin = require("./isAdmin.js")

module.exports = (req, res, next) => {
  if (isAdmin(req)) {
    return next()
  } else {
    return res.redirect("/")
  }
}