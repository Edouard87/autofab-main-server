var reservations = require("../schemas/reservations.js")

module.exports = function (callback) {
  var n = Math.floor(Math.random() * 1000000000);
  reservations.findOne({
    'conf': n
  }, function (err, result) {
    if (err) callback(err);
    else if (result) return getNumber(callback);
    else callback(null, n);
  });
}