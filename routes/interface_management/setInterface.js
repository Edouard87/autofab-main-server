module.exports = (req, res) => {
  res.cookie("interface", req.params.interface);
  res.redirect("/")
}