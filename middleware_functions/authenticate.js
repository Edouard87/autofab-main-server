const jwt = require("jsonwebtoken")
var checkURL = require("./checkURL.js")

module.exports = function(req, res, next) {
  const token = req.cookies.auth;
  var noAuthPages = [{
    name: "login",
    strict: false
  }, {
    name: "interface",
    strict: false
  }]
  console.log("URL", req.url)
  if (checkURL(noAuthPages, req)) {
    console.log("moving on...")
    next()
  } else if (token == undefined) {
    res.redirect("/p/login")
    console.log("CONNECTION REFUSED!")
  } else {
    try {
      const result = jwt.verify(token, 'hgfhjnbghj');
      req.decoded = result;
      next();
    } catch (err) {
      res.render("login", {
        iserr: false,
        err: null
      })
    }
  }
}