module.exports = function (req) {
  if (req.decoded.permission == -1) {
    return true
  } else {
    return false
  }
}