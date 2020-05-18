const fs = require('fs')
const readline = require('readline')
const ncp = require("ncp")
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const replaceExt = require('replace-ext');
const axios = require("axios");
const ejs = require("ejs")

const config = require("./preprocess.json");

const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

axios.get(config.partialDataRoute || "http://localhost/preprocess", {
    headers: {
        "preprocessor-key":config.key
    }
}).then(res => {
    var ejsData = res.data
    rl.question("Project Directory: ", (projDir) => {
      projDir = projDir || config.projDir
      rl.question(`File Directory: `, (dir) => {
        dir = dir || config.fileDir
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
            var remove = [];
            var extract = [];
            pages.forEach(page => {
              page.partials = page.partials || []
              page.replace = page.replace || []
              page.remove = page.remove || []
              page.extract = page.extract || []
              if (page.name == "all" || page.name + ".ejs" == fileName) {
                page.partials.forEach(x => {
                  partials.push(x)
                })
                page.replace.forEach(x => {
                  replace.push(x)
                })
                page.remove.forEach(x => {
                  remove.push(x)
                })
                page.extract.forEach(x => {
                  extract.push(x)
                })
              }
            });
            // Add partials
            partials.forEach(partial => {
              var loc = partial.location
              var pos = partial.position
              Object.keys(partial.meta || {}).forEach((key, i) => {
                ejsData[key] = partial.meta[key]
              })
              partial = fs.readFileSync(projDir + "/partials/" + partial.name,"utf-8")
              document.querySelectorAll(loc).forEach(x => {
                x.insertAdjacentHTML(pos, ejs.render(partial, ejsData))
              })
            })
            // Extract elements set to be extracted
            extract.forEach(x => {
              var template = new JSDOM(document.querySelectorAll(x.selector)[0].outerHTML)
              var templateDocument = template.window.document
              // console.log(templateDocument.querySelectorAll("div")[0].innerHTML)
              var path;
              // var completePath;
              var compiledTemplate;
              if (x.type == "mustache") {
                // mustache template
                path = x.path || "/public/templates/"
                x.data.forEach(y => {
                  templateDocument.querySelectorAll(y.selector).forEach(elmnt => {
                    elmnt.innerHTML = "{{" + y.key + "}}"
                  })
                })
                // compiledTemplate = template
              } else if (x.type == "ejs") {
                // ejs template
                path = x.path || "/partials/"
                // compiledTemplate = template.outerHTML
              } else {
                // custom template
              }
              if (x.remove == true) {
                // remove the elements it is supposed to remove by adding their selectors to the remove array
                remove.push(x.selector)
              }
              fs.writeFileSync(projDir + path + x.name + "." + x.type, templateDocument.querySelectorAll("body")[0].innerHTML)
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
            // Remove necesssary elements
            remove.forEach(x => {
              document.querySelectorAll(x).forEach(el => {
                el.parentNode.removeChild(el);
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