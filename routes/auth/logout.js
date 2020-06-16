module.exports = (req, res) => {
  res.clearCookie("auth");
  res.redirect("/")
}