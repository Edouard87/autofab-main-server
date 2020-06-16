const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require("fs")
const moment = require("moment")
const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server)
const encrypt = require("socket.io-encrypt")

const env = process.env.NODE_ENV || 'development';

// Setting up the Dev Environment

app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// Adding Imported Middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//mongodb stuff

const mongoose = require('mongoose');

mongoose.connect((process.env.MONGODB_URI || "mongodb://localhost/autofab"), {
  useNewUrlParser: true
})

// Importing models from schemas

var users = require("./schemas/users.js")
var machines = require("./schemas/machines.js")
var reservations = require("./schemas/reservations.js")
var reservationSets = require("./schemas/reservationSets.js")
var timetables = require("./schemas/timetables.js")
var readers = require("./schemas/readers.js")

// User auth stuff

const jwt = require("jsonwebtoken");
const hmacPass = require("./general_dependencies/hmacPass.js")

// populate default values

require("./startup_functions/default_account.js")()

var authenticate = require("./middleware_functions/authenticate.js")

// Import Middleware

var isAdmin = require("./middleware_functions/isAdmin.js")
var checkAdmin = require("./middleware_functions/checkAdmin.js")

// Import Other Dependencies

var isBetween = require("./general_dependencies/isBetween.js")

// Older function no longer used in many cases

function loadFile(req,res,next) {

  Promise.all([users.find({}), machines.find({})]).then((values) => {
    req.accounts = values[0]
    req.users = values[0]
    req.machines = values[1]
    req.readers = []
    next()
  })
    
}

// Routes

//  #Misc Routes

app.all("*", loadFile, authenticate, require("./middleware_functions/checkInterface.js"));

//  #Welcome Routes

app.get('/', require("./routes/welcome/index.js"));

app.get("/p/:name", require("./routes/welcome/students_render.js"))

app.get("/a/:name", checkAdmin, require("./routes/welcome/admin_render.js"))

//  #Interface Management

app.get("/interface/set/:interface", require("./routes/interface_management/setInterface.js"))

//  #Auth Routes

app.post("/login", require("./routes/auth/login.js"));

app.get("/logout", require("./routes/auth/logout.js"));

//  #Account Management Routes (Users)

app.get("/users/getcurrentuser", require("./routes/users/getUser.js"))

app.post("/register", require("./routes/users/register.js"))

app.post("/users/delete", checkAdmin, require("./routes/users/delete.js"));

app.post("/users/modify", checkAdmin, require("./routes/users/modify.js"));

app.get("/users/all", checkAdmin, require("./routes/users/all.js"));

app.post("/changepassword", require("./routes/users/changepassword.js"));

//  #Timetables Creation

app.post("/timetables/new", checkAdmin, require("./routes/timetables/new.js"));

app.post("/timetables/modify", checkAdmin, require("./routes/timetables/modify.js"))

//  #Reservations (note that these cannot use the Query Route as permissions vary too much)

app.post("/schedule/a", checkAdmin, require("./routes/reservations/get_schedule/admin.js"))

app.post("/schedule/p", require("./routes/reservations/get_schedule/student.js"))

app.post("/reservations/delete", require("./routes/reservations/delete.js"))

app.post("/reservations/modify", (req, res) => {});

app.get("/reservations/reservationSet/:id", checkAdmin, require("./routes/reservations/reservationSets/get.js"))

app.post("/reservations/reservationSet/action", checkAdmin, require("./routes/reservations/reservationSets/action.js"))

app.post("/reservations/approve", checkAdmin, require("./routes/reservations/approve.js"))

app.post("/reservations/cancel", require("./routes/reservations/cancel.js"));

app.post("/reservations/new", require("./routes/reservations/new.js"))

//  #Collection Query Route (general route for querying the db)

app.get("/query/:collection", require("./routes/general_database/query.js"))

//  #Machines

 app.get("/machines/all", require("./routes/machines/all.js"));

app.post("/machines/new", checkAdmin, require("./routes/machines/new.js"));

app.post("/machines/modify",require("./routes/machines/modify.js"))

app.post("/machines/delete", checkAdmin, require("./routes/machines/delete.js"));

//  #Chats

app.get("/chats/all", require("./routes/chat/all.js"))

app.post("/chats/new", require("./routes/chat/new.js"))

app.post("/chats/message", require("./routes/chat/message.js"))

app.get("/chats/messages/all", require("./routes/chat/allmessages.js"))

//  #Readers (not in other file for technical reasons)

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

//  #Socket.io for connecting

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

// Start Server

server.listen(process.env.PORT || 3000);
console.log("PORT: ", process.env.PORT)
