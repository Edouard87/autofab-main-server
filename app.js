const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require("fs")

const routes = require('./routes/index');
// const users = require('./routes/user');

const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server)

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
app.use(logger('dev'));
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

mongoose.connect((process.env.MONGODB_URI || "mongodb://localhost"), {
  useNewUrlParser: true
})

// Users

var userSchema = new mongoose.Schema({
  username: {type: String, unique: true},
  password: String,
  permission: Number,
  rfid: {type: String, unique: true}
})

var users = mongoose.model("User", userSchema);

// Machines

var machineSchema = new mongoose.Schema({
  name: String,
  type: String
})

var machines = mongoose.model("machine",machineSchema)

// Reservations

var reservationSchema = new mongoose.Schema({
  start: Number,
  end: Number,
  date: String,
  machine: String,
  username: String,
  status: String,
  justification: String
})

var reservations = mongoose.model("reservation",reservationSchema)

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
  const token = req.cookies.auth
  if (req.url == "/login") {
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

function checkAdmin(req, res, next) {
  if (req.decoded.permission == -1) {
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
    console.log(req.machines)
    next()
  })
    
}

app.all("*", loadFile, authenticate);

app.get("/p/:name", function(req, res, next) {
  var admin_pages = ["machines","users"]
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

app.post("/register", function(req, res) {
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

app.post("/login", function(req, res) {
  users.findOne({username: req.body.username}).then(data => {
    if (data == null) {
      // no user exists
      res.render("login", {
        iserr: true,
        err: "No user with that username exists. If you think this is an error, please ask your teacher to register you as a student."
      });
    } else {
      if (hmacPass(req.body.password) == data.password) {
        // password is correct
        const token = jwt.sign({
          username: req.body.username,
          permission: data.permission
        }, 'hgfhjnbghj');
        res.cookie("auth", token);
        res.redirect("/")
      } else {
        // password is incorrect
        res.render("login", {
          iserr: true,
          err: "The password you have supplied is incorrect."
        });
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

app.get("/accounts/delete/:username", checkAdmin, (req, res) => {
  users.findOneAndDelete({username: req.params.username}).then(() => {
    res.render("admin",{req:req})
  }).catch((err) => {
    res.render("admin", {
      req: req
    })
  });
});

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
      machine: req.params.id,
      date: req.params.date,
      status: "approved"
    }).then(data => res.send(data))

})

app.get("/schedule", function (req, res) {

  reservations.find().then(data => res.send(data))

})

app.get("/myreservations/:id/:date", function(req, res) {

  reservations.find({
    machine: req.params.id,
    username: req.decoded.username,
    date: req.params.date
  }).then(data => {
    console.log(data)
    res.send(data)
  })

})

 app.get("/readers/manage/:ip", function (req, res) {

   var readers = JSON.parse(fs.readFileSync(__dirname + "/data/readers.json", "utf-8")).readers;
   var reader;
   console.log(readers)

   for (var i = 0; i < readers.length; i++) {
    //    console.log("searching...")

     if (readers[i].ip == req.params.ip) {

       reader = readers[i]

     }

   }

   console.log(reader)

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

 app.get("/machine/all", function(req, res) {
  machines.find({}).then(data => {
    res.send(data)
  })
 });

app.post("/machine/new", checkAdmin, function(req, res) {

    machines.create({
      name: req.body.name,
      type: req.body.type
    }).then(() => {
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

app.get("/machine/delete/:id", checkAdmin, function (req, res) {

  machines.findByIdAndRemove(req.params.id).exec().then((err, data) => {
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



app.post("/reservations/new", function(req, res) {

  var start = Math.floor(new Date(req.body.schedule.global.date + " " + req.body.schedule.time.start).getTime() / 1000);
  var end = Math.floor(new Date(req.body.schedule.global.date + " " + req.body.schedule.time.end).getTime() / 1000);

  // find the date of the reservation in mm-dd-yyyy

  var selectedDate = req.body.schedule.global.date.split("-")
  var mm = selectedDate[1]
  var dd = selectedDate[2]
  var yyyy = selectedDate[0]
  selectedDate = mm + "-" + dd + "-" + yyyy

  console.log("date is " + selectedDate)



  reservations.find({status:"approved"}).then((data) => {
      var check = 0;

      for (var i = 0; i < data.length; i++) {

        if (isBetween(start, data[i].start, data[i].end) || isBetween(end, data[i].start, data[i].end)) {

          if (end == data[i].start && start != data[i].end) {
            check++
          } else if (start == data[i].end && end != data[i].start) {
            check++
          }

        } else {

          check++

        }

      };

      if (check == data.length) {
        // a time slot is available
        reservations.create({
          start: start,
          end: end,
          date: selectedDate,
          machine: req.body.id,
          username: req.decoded.username,
          status: "pending",
          justification: req.body.justification
        })
        res.send({
          type: "success",
          header: "Success",
          msg: "Your reservation has been made"
        })
      } else {
        // a time slot is not available
        return res.send({
          type: "err",
          header: "Reservation Failed",
          msg: "The time you requested is not available (i.e. another reservation was made by somebody else). Please try another time."
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

})

app.get("/users/deleteall", function(req, res) {

    fs.unlinkSync(__dirname + "/data/users.json");
    fs.writeFileSync(__dirname + "/data/users.json", JSON.stringify({
        users: []
    }))
    res.redirect("/")

});

try {
    fs.unlinkSync(__dirname + "/data/readers.json");
} catch(err) {}

fs.writeFileSync(__dirname + "/data/readers.json", JSON.stringify({
    readers:[]
}));
var readersFile = JSON.parse(fs.readFileSync(__dirname + "/data/readers.json","utf-8"));
var checkReaders = "";
io.on("connection", function (socket) {

    socket.emit("ping", {server: true});

    socket.on("disconnect", function(a) {
        // fs.unlinkSync(__dirname + "/data/readers.json")
        // console.log(a);
        // socket.emit("readers_update");
        // socket.on("readers_return", function(returnIP) {

        //     // for (var i = 0; i < readersFile.readers.length; i++) {

        //     //     if ()

        //     // }

        // });

    })

    // if (checkReaders == "") {

    //     console.log("it is not defined");
    //     checkReaders = setInterval(function () {

    //         io.emit("")
    //         console.log("test")
    //         console.log("incoming connection...")
    //         console.log(data.machine)
    //         console.log(data.ip)
    //         readersFile.readers.push({
    //             ip: data.ip,
    //             machine: data.machine
    //         });
    //         console.log(readersFile)
    //         fs.writeFileSync(__dirname + "/data/readers.json",JSON.stringify(readersFile));

    //     }, 1000);

    // } else {

    //     console.log("it is defined");
    //     socket.emit("readers_update")
    //     socket.on()

    // }

    socket.on("handshake", function(data) {

        // The readers who connect may only have a unique IP. Else, they will be disconnected.
        if (readersFile.readers.length == 0) {
            readersFile.readers.push({
              ip: data.ip,
              machine: data.machine
            });
            console.log(readersFile)
            fs.writeFileSync(__dirname + "/data/readers.json", JSON.stringify(readersFile));
        } else {
            for (var i = 0; i < readersFile.readers.length; i++) {

              console.log("searching...")

              if (readersFile.readers[i].ip == data.ip) {

                socket.disconnect();

              } else {

                readersFile.readers.push({
                  ip: data.ip,
                  machine: data.machine
                });
                console.log(readersFile)
                fs.writeFileSync(__dirname + "/data/readers.json", JSON.stringify(readersFile));

              }

            }
        }
        
    })
    
    socket.on("scan", function(data) {

        try {

             var file = JSON.parse(fs.readFileSync(__dirname + "/data/schedules/machine-" + data.machine + ".json"));

        } catch(err) {

            return socket.emit("status", {
                machine: data.machine,
                status: "does_not_exist"
            });

        }
        // console.log(file)
        console.log(file.schedule);

        var users = JSON.parse(fs.readFileSync(__dirname + "/data/users.json")).users;
        console.log(users)

        var authorizedUser = "";

        console.log("starting... " + users.length)

        for (var i = 0; i < users.length; i++) {

            console.log("indexing...")
            console.log(data.rfid)
            console.log(users[i].rfid)


            if (data.rfid == users[i].rfid) {

                authorizedUser = users[i].name;
                
                break;

            }

        }

        // Send appropriate status messages

        if (authorizedUser == "") {

            socket.emit("status", {
              machine: data.machine,
              status: "no_match"
            })

        } else {

            socket.emit("status", {
                machine: data.machine,
                status: "usr_match",
                user: authorizedUser
            })

        }

        var now = Math.floor(new Date().getTime() / 1000);
        var falseSlots = 0;
        console.log("checking...")
        console.log(file.schedule)

        for (var i = 0; i < file.schedule.length; i++) {

            if (file.schedule[i].name == authorizedUser) {

                if(isBetween(now, file.schedule[i].time[0], file.schedule[i].time[1])){
                    
                    return io.emit("status", {
                        machine: data.machine,
                        status: "authorized",
                        end: file.schedule[i].time[1]
                    })

                } else {
                    falseSlots++
                }

            } else {
                falseSlots++
            }

        }
        // falseSlots = falseSlots+4

        if (falseSlots==file.schedule.length) {
            console.log(falseSlots)
            console.log(file.schedule.length)
            io.emit("status", {

              machine: data.machine,
              status: "no_rez"

            });
            falseSlots = 0;
        }

    });

});

server.listen(process.env.PORT || 3000);

// module.exports = app;
