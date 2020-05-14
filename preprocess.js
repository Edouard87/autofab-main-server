const fs = require('fs')
const readline = require('readline')
const ncp = require("ncp")
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const replaceExt = require('replace-ext');
const axios = require("axios");
const ejs = require("ejs")

const config = require("./preprocess.json");

console.log("CONFIG: " + config.json)

const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

console.log("Retrieving server resources...")
axios.get(config.partialDataRoute || "http://localhost/preprocess", {
    headers: {
        "preprocessor-key":config.key
    }
}).then(res => {
    console.log("connected!")
    var ejsData = res.data
    rl.question("Project Directory: ", (projDir) => {
      projDir = config.projDir || projDir
      rl.question(`File Directory: `, (dir) => {
        dir = config.fileDir || dir
        var files = fs.readdirSync(dir, "utf-8")
        var oldPath;
        var newPath;
        var dom;
        var document;
        var elements;
        var fileName;
        var pages = config.pages || [];
        files.forEach(file => {
          oldPath = dir + "/" + file;
          newPath = projDir + "/public/imported/" + file;
          if (file.includes(".html")) {
            fileName = replaceExt(file, ".ejs")
            console.log("File name:", fileName)
            file = fs.readFileSync(oldPath, "utf-8")
            dom = new JSDOM(file);
            document = dom.window.document
            elements = document.querySelectorAll("link");
            // Making sure all of the references are optimized for the server
            Array.prototype.forEach.call(elements, function (el, i) {
              el.href = el.href.replace(/./, "../imported")
            });
            elements = document.querySelectorAll("img");
            Array.prototype.forEach.call(elements, function (el, i) {
              el.src = el.getAttribute("anima-src").replace(/./, "../imported")
            });
            elements = document.querySelectorAll("a");
            Array.prototype.forEach.call(elements, function (el, i) {
              el.href = el.href.substring(0, el.href.indexOf('.'));
            });
            // Add partials 
            var partials = [];
            var replace = [];
            pages.forEach(page => {
              page.partials = page.partials || []
              page.replace = page.replace || []
              if (page.name == "all" || page.name + ".ejs" == fileName) {
                page.partials.forEach(x => {
                  partials.push(x)
                })
                page.replace.forEach(x => {
                  replace.push(x)
                })
              }
            });
            partials.forEach(partial => {
              var loc = partial.location
              var pos = partial.position
              partial = fs.readFileSync(projDir + "/partials/" + partial.name,"utf-8")
              document.querySelectorAll(loc).forEach(x => {
                x.insertAdjacentHTML(pos, ejs.render(partial, ejsData))
              })
            })
            // Replace elements set to be replaced
            replace.forEach(x => {
                Object.keys(x.meta || {}).forEach((key, i) => {
                    ejsData[key] = x.meta[key]
                })
              var replaceELm = fs.readFileSync(projDir + "/partials/" + x.partial + ".ejs","utf-8")
              var renderedpartial = ejs.render(replaceELm, ejsData)
              document.querySelectorAll(x.selector).forEach(el => {
                el.outerHTML = renderedpartial
              })
            })
            // write the finalized html page
            fs.writeFileSync(projDir + "/views/" + fileName, dom.serialize())
          } else if (file.includes(".")) {
            // we are ignoringing all other files
          } else {
            if (!fs.existsSync(projDir + "/public/imported/")) {
              fs.mkdirSync(projDir + "/public/imported/");
            }
            ncp(oldPath, newPath, function (err) {
              if (err) {
                return console.error(err);
              }
            });
          }
        })
        rl.close();
      })
    })
})