const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require("fs")
var uniqueValidator = require('mongoose-unique-validator');

// moment.js is used for time validation

const moment = require("moment")

const routes = require('./routes/index');
// const users = require('./routes/user');

const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server)

const encrypt = require("socket.io-encrypt")

const env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

console.log("========[ ENVIRONMENT VARIABLES ]===========")
console.log(process.env.PORT)
console.log(process.env.MONGODB_URI)

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Stuff for user auth

const store = require("data-store")(__dirname + "/data/accounts.json");

//mongodb stuff

const mongoose = require('mongoose');

mongoose.connect((process.env.MONGODB_URI || "mongodb://localhost/autofab"), {
  useNewUrlParser: true
})

// Users

var userSchema = new mongoose.Schema({
  username: {type: String, unique: true},
  password: {type: String, required: true},
  permission: {type: Number, required: true},
  rfid: {type: String, unique: true, required: true}
})

var users = mongoose.model("User", userSchema);

// Machines

var machineSchema = new mongoose.Schema({
  name: {type: String, unique: true, required: true},
  type: {type: String, required: true},
  description: String
})

var machines = mongoose.model("machine",machineSchema)

// Reservations

var reservationSchema = new mongoose.Schema({
  createdAt: Number,
  updatedAt: Number,
  start: {type: Number, required: true},
  end: {type: Number, required: true},
  date: {type: String, required: true},
  machine: {type: String, required: true},
  username: {type: String, required: true},
  status: {type: String, required: true},
  justification: {type: String, required: true},
  actionReason: String,
  conf: Number
}, { 
    timestamps: { currentTime: () => Math.floor(Date.now() / 1000) }
})

var reservations = mongoose.model("reservation",reservationSchema)

// Reservations tablesets

var reservationSetSchema = new mongoose.Schema({
  createdAt: Number,
  updatedAt: Number,
  reject: {
    type: Array
  },
  approve: {
    type: Object
  }
}, {
  timestamps: { currentTime: () => Math.floor(Date.now() / 1000) }
})

var reservationSets = mongoose.model("reservationSet", reservationSetSchema)

// readers

var readersSchema = new mongoose.Schema({
  ip: {type: String, unique: true},
  machine: {type: String, required: true},
  status: {type: String, required: true}
})

var readers = new mongoose.model("reader",readersSchema)

// User auth stuff

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

function hmacPass(password) {
  return crypto.createHmac("sha256", "edtgfaufruwe").update(password).digest("hex")
}

// populate default values

users.find().then(doc => {
  if (doc.length == 0) {
    users.create({
      username: "admin",
      password: hmacPass("admin"),
      permission: -1,
      rfid: 1
    })
  }
})

function authenticate(req, res, next) {
  const token = req.cookies.auth;
  console.log("URL",req.url)
  if (req.url == "/login" || req.url == "/preprocess" || req.url == "/p/old") {
    console.log("moving on...")
    next()
  } else if (token == undefined) {
    res.render("login", {iserr: false, err: null})
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

function isAdmin(req) {
  if (req.decoded.permission == -1) {
    return true
  } else {
    return false
  }
}

function checkAdmin(req, res, next) {
  if (isAdmin(req)) {
    return next()
  } else {
    return res.redirect("/")
  }
}

// other stuff

function isBetween(x, min, max) {

    if (x >= min && x <= max ) {

      return true

    } else {
      
      return false
    
    }

}

function formatDate(date) {

    var dd = date.getDate();
    var mm = date.getMonth() + 1; //January is 0!

    var yyyy = date.getFullYear();
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }

    var formattedDate = mm + "-" + dd + "-" + yyyy

    return formattedDate;

}

function loadFile(req,res,next) {

  Promise.all([users.find({}), machines.find({})]).then((values) => {
    req.accounts = values[0]
    req.users = values[0]
    req.machines = values[1]
    req.readers = []
    next()
  })
    
}

app.all("*", loadFile, authenticate);

app.get("/p/:name", function(req, res, next) {
  var admin_pages = ["machines","users","readers"]
  for (var i = 0; i < admin_pages.length; i++) {
    if (req.params.name == admin_pages[i]) {
      return res.redirect("/a/" + req.params.name)
    }
  }
  res.render(req.params.name, {req: req})
})

app.get("/a/:name", checkAdmin, function (req, res, next) {
  res.render(req.params.name, { req: req })
})

app.get("/preprocess", (req, res) => {

  console.log(req.headers)

  if (req.headers["preprocessor-key"] == "kFHSJaiHhsUFHUEWS1345rnsd") {
    Promise.all([users.find({}), machines.find({})]).then((values) => {
      req.accounts = values[0]
      req.users = values[0]
      req.machines = values[1]
      req.readers = []
      res.send({
        accounts: values[0],
        users: values[0],
        machines: values[1]
      })
    })
  } else {
    res.redirect("/p/login")
  }
})

app.post("/login", function(req, res) {
  users.findOne({username: req.body.username}).then(data => {
    if (data == null) {
      // no user exists
      res.send({
        type: "err",
        header: "Login Failed",
        msg: "No user exists with that username.",
        code: 11
      })
    } else {
      if (hmacPass(req.body.password) == data.password) {
        // password is correct
        const token = jwt.sign({
          username: req.body.username,
          permission: data.permission
        }, 'hgfhjnbghj');
        res.cookie("auth", token);
        res.send({
          code: 0
        })
      } else {
        // password is incorrect
        res.send({
          code: 12
        })
      }
    }
  })
});

app.get("/logout", (req, res) => {

  res.clearCookie("auth");
  res.redirect("/")

});

app.get('/', function(req, res) {
  res.redirect("/p/home")
});

app.get("/query/:collection", (req, res) => {
  var studentAllowed = ["machines","reservations"]
  if ((!isAdmin(req)) && (!(studentAllowed.includes(req.params.collection)))) {
    console.log("UNAUTHORIZED")
    res.send({
      code: 14
    })
  } else {
    try {
      eval(req.params.collection).find(req.query).then(docs => {
        res.send(docs)
      }).catch((err, doc) => {
        console.err(err)
      })
    } catch (err) {
      console.err(err)
    }
  }
  
})

app.get("/users/getcurrentuser", (req, res) => {
  console.log("user:", req.decoded.username)
  res.send({username: req.decoded.username})
})

app.post("/register", function (req, res) {
  users.create({
    username: req.body.username,
    password: hmacPass(req.body.password),
    permission: req.body.permission,
    rfid: req.body.rfid
  }).then(() => {
    res.send({
      type: "success",
      header: "User Created",
      msg: "User " + req.body.username + " was created."
    })
  }).catch((err) => {
    res.send({
      type: "err",
      header: "Failed to create user",
      msg: "User " + req.body.username + " could not be created. Please make sure you supply a unique username and RFID tag."
    })
  })
})

app.post("/users/delete", checkAdmin, (req, res) => {
  users.findByIdAndDelete(req.body.id).exec().then(doc => {
    res.send({
      type: "success",
      header: "Success",
      msg: "User successfully deleted."
    })
  })
});

app.post("/users/modify",checkAdmin, (req, res) => {
  users.findOneAndUpdate({_id: req.body.id},req.body).exec().then(doc => {
    res.send({
      type: "success",
      header: "Changes Saved Successfully",
      msg: "User " + doc.username + "'s profile was updated successfully."
    })
  }).catch((err) => {
    res.send({
      type: "err",
      header: "Your changes could not be saved.",
      msg: "There was a problem editing user " + req.body.username + "'s profile. Please make sure you supply a unique username and RFID tag."
    })
  })
})

app.post("/changepassword", (req, res) => {

  users.findOneAndUpdate({username: req.decoded.username},{password: hmacPass(req.body.password)}).then(() => {
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
});


app.get("/schedule/:id/:date", function(req, res) {

    reservations.find({
      $or: [
        {
          machine: req.params.id,
          date: req.params.date,
          status: "approved"
        },{
          machine: req.params.id,
          date: req.params.date,
          status: "pending",
          username: req.decoded.username
        }
      ]
    }).then(data => {
      res.send(data)
    })

})

app.post("/schedule/a", checkAdmin, function (req, res) {
  reservations.find(req.body).then(data => res.send(data)).catch(err=>console.log(err))
})

app.post("/schedule/p", function (req, res) {
  req.body.username = req.decoded.username
  reservations.find(req.body).then(data => res.send(data)).catch(err => console.log(err))
})

app.get("/myreservations/:id/:date", function(req, res) {
  reservations.find({
    machine: req.params.id,
    username: req.decoded.username,
    date: req.params.date
  }).then(data => {
    res.send(data)
  })
})

 app.get("/readers/manage/:ip", function (req, res) {

   var readers = JSON.parse(fs.readFileSync(__dirname + "/data/readers.json", "utf-8")).readers;
   var reader;

   for (var i = 0; i < readers.length; i++) {

     if (readers[i].ip == req.params.ip) {

       reader = readers[i]

     }

   }

   var machines = JSON.parse(fs.readFileSync(__dirname + "/data/machines.json", "utf-8")).machines

   res.render("manage-readers", {
     reader: reader,
     machines: machines
   });

 })

 app.post("/readers/pushmachine", function(req, res) {

    io.emit("reader_change_machine",{destination: req.body.ip, new_machine: req.body.machine});
    res.redirect("/readers/manage/" + req.body.ip);

 });

 app.get("/machines/all", function(req, res) {
  machines.find({}).then(data => {
    res.send(data)
  })
 });

app.post("/machines/new", checkAdmin, function(req, res) {

  console.log("Machine",req.body)

    machines.create(req.body).then(() => {
      res.send({
        type: "success",
        header: "Success",
        msg: "Machine " + req.body.name + ", which is a " + req.body.type + " was created successfully."
      })
    }).catch(err => {
      res.send({
        type: "err",
        header: "Failed to create machine",
        msg: "An unknown error occured."
      })
    });
    

});

app.post("/machines/modify",(req, res) => {
  console.log("id is: " + req.body._id)
  machines.findOneAndUpdate({_id: req.body.id},req.body).exec().then(doc => {
    res.send({
      type: "success",
      header: "Changes Saved",
      msg: "The machine was updated"
    }).catch((doc,err) => {
      console.log(err)
    })
  })
})

app.post("/machines/delete", checkAdmin, function (req, res) {

  machines.findByIdAndRemove(req.body.id).exec().then((err, data) => {
    res.send({
      type: "success",
      header: "Success",
      msg: "Machine successfully deleted."
    })
  })

});

app.get("/machine/clear/:machine", checkAdmin, function (req, res) {

    var file = JSON.parse(fs.readFileSync(__dirname + "/data/schedules/machine-" + req.params.machine + ".json", "utf-8"));
    file.schedule.length = 0;
    fs.writeFileSync(__dirname + "/data/schedules/machine-" + req.params.machine + ".json", JSON.stringify(file));
    res.redirect("/");

})

app.get("/reserve", (req, res) => {

  res.render("make_reservation", {req: req, iserr: false, err: null, status: null})

});

app.post("/reservations/delete", (req, res) => {
  if (isAdmin(req)) {
    reservations.findByIdAndDelete({
      _id: req.body.id
    }).exec().then((document) => {
      res.send({
        type: "success",
        header: "Success",
        msg: "The resrevation was successfully deleted. It will not longer take place"
      })
    }).catch((err) => {
      console.log(err)
      res.send({
        type: "error",
        header: "Error",
        msg: "An error occured"
      })
    })
  } else {
    reservations.findOneAndDelete({
      username: req.decoded.username,
      _id: req.body.resId
    }).exec().then((document) => {
      res.send({
        type: "success",
        header: "Success",
        msg: "The reservation was successfully deleted. It will not longer take place"
      })
    }).catch((err) => {
      res.send({
        type: "error",
        header: "Error",
        msg: "An error occured"
      })
    })
  }
  
})

app.post("/reservations/modify", (req, res) => {



});

function checkConflict(resRequest, dbData, user) {
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

function configTimes(data) {
  var start = moment(data.date + ", " + data.start,"MM-DD-YYYY, hh:mm A")
  var end = moment(data.date + ", " + data.end,"MM-DD-YYYY, hh:mm A")
  return {
    start: start,
    end: end,
    date: data.date
  }
}

app.get("/reservations/reservationSet/:id", checkAdmin, (req, res) => {
  reservationSets.findById(req.params.id).then(doc => {
    res.send(doc.reject)
  })
})

app.post("/reservations/reservationSet/action", checkAdmin, (req, res) => {
  console.log("BODY", req.body)
  reservationSets.findById(req.body.reservationSet).then(resSet => {
    console.log("SET1", resSet)
    var reservation;
    var dataPromises = [];
    for (var i = 0; i < resSet.reject.length; i++) {
      console.log("REJECTING...")
      reservation = resSet.reject[i]
      console.log("ID", reservation._id)
      dataPromises.push(reservations.findById(reservation._id).then(doc => {
        console.log("Changing status...")
        doc.status = "rejected"
        doc.actionReason = req.body.actionReason
        doc.save().then(doc=> {

        }).catch(err => {
          console.log(err)
        })
      }))
    }
    console.log("APPROVING...")
    dataPromises.push(reservations.findById(resSet.approve._id).then(doc => {
      console.log("Changing status...2")
      doc.status = "approved"
      doc.save()
    }))
    console.log("PROMISES",dataPromises)
    Promise.all(dataPromises).then(values => {
      console.log(values)
      res.send({
        type: "success",
        header: "Success",
        msg: "The reservation was approved. All conflicting reservations were rejected."
      })
    })
  })
})

app.post("/reservations/approve", checkAdmin, function(req, res) {

  reservations.findOne({
    _id: req.body._id,
  }).then(doc => {
    if (doc.status != "pending") {
      res.send({
        type:"err",
        header: "Unable to approve",
        msg: "You can only approve pending reservations.",
        code: 10
      })
    } else {
      reservations.find({
        status: "pending"
      }).then(allRes => {
        console.log(doc)
        var conflict = checkConflict(doc, allRes, req.body.username)
        if (conflict.conflicting.excludeSelf.length == 0) {
          doc.status = "approved"
          doc.save().then(() => {
            res.send({
              status: "success",
              msg: "There were no conflicting reservations. It was approved",
              header: "Success!",
              code: 0
            })
          })
          console.log("no conflict")
        } else {
          console.log("conflict!")
          console.log("Conflicting Status:")
          for (var i = 0; i < conflict.conflicting.excludeSelf.length; i++) {
            console.log(conflict.conflicting.status)
          }
          reservationSets.create({
            reject: conflict.conflicting.excludeSelf,
            approve: doc
          }).then(set => {
            res.send({
              status: "warn",
              code: 1000,
              data: {
                reservationSet: set._id,
                conflicting: conflict.conflicting.excludeSelf
              }
            })
          }).catch((err, doc) => {
            if (err.code == 11000) {
              console.log("Duplicate Entry")
            }
          })
        }
      })
    }
  })

})

app.post("/reservations/cancel", (req, res) => {

  console.log("BODY",req.body)
  console.log("_ID",req.body._id)

  var query;
  var no = ["rejected"]

  if (isAdmin(req)) {
    query = {
      _id: req.body._id,
    }
  } else {
    query = {
      _id: req.body._id,
      username: req.decoded.username
    }
  }
  reservations.findOne(query).then((doc) => {
    doc.status = "canceled"
    doc.save()
    if (no.includes(doc.status)) {
      res.send({
        type: "err",
        header: "Cannot cancel",
        msg: "You cannot cancel this reservation"
      })
    } else {
      res.send({
        type: "success",
        header: "Reservation Cancelled",
        msg: "Your reservation will no longer be taking place"
      })
    }
  })

});

function getNumber(callback) {
  var n = Math.floor(Math.random() * 1000000000);
  reservations.findOne({
    'conf': n
  }, function (err, result) {
    if (err) callback(err);
    else if (result) return getNumber(callback);
    else callback(null, n);
  });
}

app.post("/reservations/new", function(req, res) {

  var times = configTimes(req.body)
  start = times.start
  end = times.end
  selectedDate = times.date
  // make sure the username is the user. An admin does not need to do it this way.
  req.body.username = req.decoded.username

  reservations.find({
    $or: [{
      status: "pending",
      username: req.body.username,
      date: selectedDate
    },
    {
      status: "approved",
      date: selectedDate
    }]
  }).then(doc => {
    console.log("DOC",doc)
    var conflict = checkConflict({
      start: start,
      end: end
    }, doc, req.body.username)
    if(!conflict.isConflict) {
      getNumber((err, conf) => {
        if (err) return console.log(err)
        reservations.create({
          start: start,
          end: end,
          machine: req.body.machine,
          justification: req.body.justification,
          username: req.body.username,
          status: "pending",
          date: selectedDate,
          conf: conf
        }).then((doc) => {
          res.send({
            type: "success",
            header: "Reservation Made",
            msg: "Your reservation has been made.",
            code: 1,
            data: {
              conf: conf
            }
          })
        }).catch((err) => {
          // An error occured (can be with the validation)
          console.log(err)
          if (err.name == "ValidationError") {
            var fields = " "
            for (field in err.errors) {
              if (fields == " ") {
                fields += field
              } else {
                fields += ", " + field
              }
            }
            res.send({
              type: "err",
              header: "Unable to make reservation",
              msg: "Please make sure the following field(s) are filled: " + fields,
              code: 13
            })
          }
        })
      })
    } else {
      // there is a conflict
       res.send({
         type: "success",
         header: "Unable to make your reservation",
         msg: conflict.message
       })
    }
  })

});

app.get("/reservations/delete/:id", (req, res) => {

  reservations.findOneAndDelete({
    username: req.decoded.username,
    _id: req.params.id
  }).exec().then((data, err) => {
    res.redirect("/")
  })

});

app.post("/users/new", function(req, res) {

    var usersFile = JSON.parse(fs.readFileSync(__dirname + "/data/users.json", "utf-8"));
    for (var i = 0; i < usersFile.users.length; i++) {

        if (usersFile.users[i].name == req.body.name) {return res.send("Error. User already exists")}
        if (usersFile.users[i].rfid == req.body.rfid) {
          return res.send("Error. RFID is already taken")
        }

    }

    usersFile.users.push({
        name: req.body.name,
        rfid: req.body.rfid
    });

    fs.writeFileSync(__dirname + "/data/users.json", JSON.stringify(usersFile));
    res.redirect("/")

});

app.get("/users/all", checkAdmin, function(req, res) {

  users.find().then(data => {
    res.send(data)
  })

})

app.get("/users/deleteall", function(req, res) {

    fs.unlinkSync(__dirname + "/data/users.json");
    fs.writeFileSync(__dirname + "/data/users.json", JSON.stringify({
        users: []
    }))
    res.redirect("/")

});

var connectedReaders =[];

app.get("/readers/tmp", checkAdmin, (req, res) => {
   readers.find().then(data => {
     var ips = [];
     var sendItems = [];
     data.forEach(elmnt => {
       ips.push(elmnt.ip)
     })
    connectedReaders.forEach(elmnt => {
      if (!ips.includes(elmnt.ip)) {
        sendItems.push(elmnt)
      }
    })
    res.send(sendItems)
   })
})

app.post("/readers/accept", checkAdmin, (req, res) => {
  readers.create({
    ip: req.body.ip,
    machine: req.body.machine
  }).then(() => {
    res.send({
      type: "success",
      header: "Machine added",
      msg: "The machine was successfully added"
    })
  });
});

app.post("/readers/delete", checkAdmin, (req, res) => {
  readers.findByIdAndDelete(req.body.readerId).exec().then(doc => {
    res.send({
      type: "success",
      header: "Reader Deleted",
      msg: "The reader was deleted"
    })
  }).catch(err => {
    console.log(err)
  })
})

app.post("/readers/modify", checkAdmin, (req, res) => {
  readers.find({
    _id: req.body.readerId
  }).then((doc) => {
    console.log(doc)
  })
  readers.findOneAndUpdate({_id: req.body.readerId},req.body).exec().then((doc) => {
    console.log("changed document", doc)
    res.send({
      type: "success",
      header: "Changes Saved",
      msg: "The reader was successfully updated"
    })
  }).catch((err) => {
    console.log(err)
  })
})

app.get("/readers/all", checkAdmin, (req, res) => {
  readers.find().then(data => {
    var ips = [];
    var sendItems = [];
    connectedReaders.forEach(elmnt => {
      ips.push(elmnt.ip)
    })
    data.forEach(elmnt => {
      if (ips.includes(elmnt.ip)) {
        elmnt.status="connected"
      } else {
        elmnt.status = "not connected"
      }
      sendItems.push(elmnt)
    })
    res.send(sendItems)
  })
})

io.use(encrypt(process.env.secret || "secret"))

io.on("connection", function(socket) {

  console.log("User has connected!")

    socket.on("disconnect", function(a) {
      var i = connectedReaders.indexOf(socket);
      connectedReaders.splice(i, 1);
    })

    socket.on("handshake", function(data) {
        connectedReaders.push({
          ip: data.ip,
          text: data.text
        });
    })

    async function findUser(data) {
      await users
      users.find({
        rfid: data.id
      }).then(foundUser => {
        io.emit("user", foundUser[0])
      })
    }
    
    socket.on("scan", async function(data) {

      data.id = data.id.toString();
      data.id = data.id.trim()
      findUser(data)

    });

});

server.listen(process.env.PORT || 3000);
console.log("PORT: ", process.env.PORT)

// module.exports = app;
