const isBetween = require("./isBetween.js")

module.exports = function(resRequest, dbData, user) {
  var check = 0;
  var usernames = [];
  var message = '';
  var isConflict;
  var conflicting = [];
  var all;

  for (var i = 0; i < dbData.length; i++) {

    var reqBetween = (isBetween(resRequest.start, dbData[i].start, dbData[i].end) || isBetween(resRequest.end, dbData[i].start, dbData[i].end));
    var dbBetween = (isBetween(dbData[i].start, resRequest.start, resRequest.end) || isBetween(dbData[i].end, resRequest.start, resRequest.end))

    if (reqBetween || dbBetween) {
      if (resRequest.end == dbData[i].start && resRequest.start != dbData[i].end) {
        check++
      } else if (resRequest.start == dbData[i].end && resRequest.end != dbData[i].start) {
        check++
      } else {
        conflicting.push(dbData[i])
      }
    } else {
      check++
    }

    if (dbData[i].status == "pending") {
      usernames.push(dbData[i].username)
    }

  };
  all = conflicting.slice()
  excludeSelf = conflicting.slice()
  for (var i = 0; i < excludeSelf.length; i++) {
    if (excludeSelf[i]._id == resRequest.id) {
      excludeSelf.splice(i, 1)
    }
  }
  isConflict = !(check == dbData.length)
  if (isConflict) {
    if (usernames.includes(user)) {
      message = "You have already made a reservation for this."
    } else {
      message = "Somebody else has already reserved this machine"
    }
  } else {
    message = "A machine is available!"
  }
  return {
    isConflict: isConflict,
    message: message,
    conflicting: {
      all: all,
      excludeSelf: excludeSelf
    }
  }
}