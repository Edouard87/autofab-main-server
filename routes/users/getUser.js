module.exports = (req, res) => {
    console.log("user:", req.decoded.username)
    res.send({
      username: req.decoded.username
    })
}
