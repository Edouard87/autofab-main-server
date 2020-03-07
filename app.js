const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require("fs")

const routes = require('./routes/index');
const users = require('./routes/user');

const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server)

const env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

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

function isBetween(x, min, max) {

    if (x >= min && x <= max ) {

        return true

    } else {return false}

}

app.get('/', (req, res) => {

    var machines =  JSON.parse(fs.readFileSync(__dirname + "/data/machines.json", "utf-8")).machines
    var schedules = [];
    var readers = JSON.parse(fs.readFileSync(__dirname + "/data/readers.json")).readers;
    var users = JSON.parse(fs.readFileSync(__dirname + "/data/users.json")).users;

    for (var i = 0; i < machines.length; i++) {

        schedules.push(JSON.parse(fs.readFileSync(__dirname + "/data/schedules/machine-" + machines[i].index + ".json", "utf-8")).schedule)

    };

    res.render("index", { machines: machines, schedules: schedules, readers: readers, users: users})

});

app.get("/schedule/:machine", function(req, res) {

    try {

        var schedule = JSON.parse(fs.readFileSync(__dirname + "/data/schedules/" + req.params.machine + ".json")).schedule
        res.send(schedule)

    } catch(err) {

        console.log("No schedule to show, as no machines have been created")

    }

});

 app.get("/readers/manage/:ip", function (req, res) {

   console.log("opening...")

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

app.post("/machine/new", function(req, res) {

    var file = JSON.parse(fs.readFileSync(__dirname + "/data/machines.json", "utf-8"));
    var index = -1;
    for (var i = 0; i < file.machines.length; i++) {

        console.log(req.body.machine)
        console.log(file.machines[i].name)

        if (req.body.machine == file.machines[i].name) {

            return res.send("that name already exists")

        }

        if (index < file.machines[i].index) {

            index = file.machines[i].index

        }

    }

    // Assign the index

    var assignedIndex = index+1

    // Create the machine

    file.machines.push({
        "name": req.body.machine,
        "index": assignedIndex
    })
    fs.writeFileSync(__dirname + "/data/machines.json", JSON.stringify(file))

    // Create the schedule for it

    fs.writeFileSync(__dirname + "/data/schedules/machine-" + assignedIndex + ".json", JSON.stringify({
        schedule: []
    }));

    console.log(file)

    res.redirect("/")

});

app.get("/machine/delete/:machine", function(req, res) {

    // Remove from machines directory

    console.log("Deleting...")

    var index;

    var file = JSON.parse(fs.readFileSync(__dirname + "/data/machines.json", "utf-8"));
    console.log(file)
    for (var i = 0; i < file.machines.length; i++) {

        console.log("searching...")
        console.log(req.params.machine)

        if (file.machines[i].name == req.params.machine) {
            // Remove schedule
            fs.unlinkSync(__dirname + "/data/schedules/machine-" + file.machines[i].index + ".json")
            // Remove from machines database
            file.machines.splice(i, 1);
            fs.writeFileSync(__dirname + "/data/machines.json", JSON.stringify(file))
            return res.redirect("/")
        }

    }

    res.send("An error occured")

});

app.get("/machine/clear/:machine", function(req, res) {

    var file = JSON.parse(fs.readFileSync(__dirname + "/data/schedules/machine-" + req.params.machine + ".json", "utf-8"));
    file.schedule.length = 0;
    fs.writeFileSync(__dirname + "/data/schedules/machine-" + req.params.machine + ".json", JSON.stringify(file));
    res.redirect("/");

})

app.post("/reserve", function(req, res) {

    var start = Math.floor(new Date(req.body.schedule.global.date + " " + req.body.schedule.time.start).getTime() / 1000);
    var end = Math.floor(new Date(req.body.schedule.global.date + " " + req.body.schedule.time.end).getTime() / 1000);
    
    var data = JSON.parse(fs.readFileSync(__dirname + "/data/schedules/machine-" + req.body.machine + ".json", "utf-8"))
    
    
    for (var i = 0; i < data.schedule.length; i++) {

        if (isBetween(start, data.schedule[i].time[0], data.schedule[i].time[1]) || isBetween(end, data.schedule[i].time[0], data.schedule[i].time[1])) {

            return res.render("reservationFail.ejs")

        }

    };

    data.schedule.push({
      name: req.body.user,
      time: [start, end]
    })
    fs.writeFileSync(__dirname + "/data/schedules/machine-" + req.body.machine + ".json", JSON.stringify(data));
    res.render("reservationSuccess.ejs")

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

server.listen(3000);

// module.exports = app;
