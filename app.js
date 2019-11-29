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

    for (var i = 0; i < machines.length; i++) {

        schedules.push(JSON.parse(fs.readFileSync(__dirname + "/data/schedules/machine-" + machines[i].index + ".json", "utf-8")).schedule)

    };
    
    console.log(schedules)

    res.render("index", {machines: machines, schedules: schedules})

});

app.get("/schedule/:machine", function(req, res) {

    var schedule = JSON.parse(fs.readFileSync(__dirname + "/data/schedules/" + req.params.machine + ".json")).schedule
    res.send(schedule)

});

app.post("/reserve", function(req, res) {

    var start = Math.floor(new Date(req.body.schedule.date.start + " " + req.body.schedule.time.start + "+00:00").getTime() / 1000);
    var end = Math.floor(new Date(req.body.schedule.date.end + " " + req.body.schedule.time.end + "+00:00").getTime() / 1000);
    
    var data = JSON.parse(fs.readFileSync(__dirname + "/data/schedules/machine-" + req.body.machine + ".json", "utf-8"))
    
    
    for (var i = 0; i < data.schedule.length; i++) {

        console.log(data.schedule.length)

        console.log("======== TESTING ========")

        console.log(isBetween(start, data.schedule[i].time[0], data.schedule[i].time[1]))
        console.log(isBetween(end, data.schedule[i].time[0], data.schedule[i].time[1]))

        console.log("======== TESTING ========")

        if (isBetween(start, data.schedule[i].time[0], data.schedule[i].time[1]) || isBetween(end, data.schedule[i].time[0], data.schedule[i].time[1])) {

            return res.send("This time slot is unavailable...")

        }

    };

    data.schedule.push({
      name: req.body.user,
      time: [start, end]
    })
    console.log(data);
    console.log(JSON.stringify(data))
    fs.writeFileSync(__dirname + "/data/schedules/machine-" + req.body.machine + ".json", JSON.stringify(data));
    res.send("This time slot is available!")

});

io.on("connection", function (socket) {

    socket.emit('hello', { data: 'name' });
    socket.on("event", function (data) {

        console.log("data")

    })
    socket.on("trigger", function(data) {

        console.log(data);

    });
    
    socket.on("scan", function(data) {

        var file = JSON.parse(fs.readFileSync(__dirname + "/data/schedules/machine-" + data.machine + ".json"));
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
                status: "usr_match"
            })

        }

        var now = Math.floor(new Date().getTime() / 1000);
        // var now = 1574833200

        console.log("Next step...")

        for (var i = 0; i < file.schedule.length; i++) {

            if (file.schedule[i].name == authorizedUser) {

                if(isBetween(now, file.schedule[i].time[0], file.schedule[i].time[1])){

                    console.log("This time slot was reserved by you.");
                    
                    return io.emit("status", {
                        machine: data.machine,
                        status: "authorized",
                        end: file.schedule[i].time[1]
                    })

                }

            }

        }

        io.emit("status", {

            machine: data.machine,
            status: "no_rez"

        });

    });

});

server.listen(3000);

// module.exports = app;
