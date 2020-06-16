module.exports = (req, res) => {

  users.findOneAndUpdate({
    username: req.decoded.username
  }, {
    password: hmacPass(req.body.password)
  }).then(() => {
    res.send({
      type: "success",
      header: "Success",
      msg: "Your password has been changed"
    })
  }).catch(err => {
    res.send({
      type: "err",
      header: "Error",
      msg: "An unknown error occured. Please seek assistance; there may be an error in your account."
    })
  })
}