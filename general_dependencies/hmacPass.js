const crypto = require("crypto");

module.exports = function(password) {
  return crypto.createHmac("sha256", "edtgfaufruwe").update(password).digest("hex")
}