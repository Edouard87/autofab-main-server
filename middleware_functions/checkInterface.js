module.exports = function(req, res, next) {
  if (req.url.includes("/interface/set")) {
    next()
  } else if (req.cookies.interface == undefined) {
    return res.redirect("/interface/set/regular")
  } else {
    next()
  }
}