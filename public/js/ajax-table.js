var tableConfig = [];
var unsummoned = [];

const ajaxTable = {
  setup: (x) => {
    var e = []
    if (x instanceof Array) {
      e = x
    } else {
      e.push(x)
    }
    tableConfig = e
    // setupAjaxTable()
  },
  refreshAll: () => {
    setupAjaxTable();
    retrySummon();
  },
  connect: (x,y) => {
    y.target = x;
    tableConfig.push(y)
    ajaxTable.refreshAll()
  },
  summon: (x,y,z) => {
    summonTable(x,y,z)
  }
}

function setupAjaxTable() {
  console.log("running...")
  tableConfig.forEach((ajaxTableElm) => {
    var isAction = ajaxTableElm.action instanceof Function
    try {
      if (ajaxTableElm.target.html() == undefined) {
        ajaxTableElm.target = $(".ajax-table")
      }
    } catch(err) {
      ajaxTableElm.target = $(".ajax-table")
    }
    var query;
    try {
      query = ajaxTableElm.preSend()
    } catch (err) {
      query = {}
    }
    console.log("running ajax")
    console.log(ajaxTableElm.target.data("url"))
    $.ajax({
      url: ajaxTableElm.target.data("url"),
      method: ajaxTableElm.target.data("method"),
      context: ajaxTableElm.target.find(".action-btn"),
      data: JSON.stringify(query),
      contentType: 'application/json',
      success: data => {
        console.log("success", data)
        if (data[0] instanceof Object) {
          ajaxTableElm.target.parent().css("display", "block")
          $(".nothing-display").remove()
          data.forEach((elmt) => {
            try {
              ajaxTableElm.validator(elmt)
            } catch (err) {
              console.log("Ajax Table: No validators")
            }
          })
          var tRow = "<tr>"
          var tag;
          ajaxTableElm.target.find("thead td[data-tag]").each(index => {
            tag = ajaxTableElm.target.find("thead td")[index].getAttribute("data-tag")
            tRow = tRow + "<td data-content='{{" + tag + "}}'>{{" + tag + "}}</td>"
          })
          if (isAction) {
            tRow += "<td><button "
            ajaxTableElm.target.find("thead td[data-tag]").each(index => {
              tRow += "data-" + ajaxTableElm.target.find("thead td")[index].getAttribute("data-tag") +
                "='{{" + ajaxTableElm.target.find("thead td")[index].getAttribute("data-tag") + "}}' "
            })
            tRow += " class='action-btn'>Manage</button></td></tr>"
          } else {
            tRow += "</tr>"
          }
          ajaxTableElm.target.find("tbody").empty();
          data.forEach(element => {
            ajaxTableElm.target.find("tbody").append(Mustache.to_html(tRow, element))
          });
          ajaxTableElm.actionClasses.forEach(elmt => {
            ajaxTableElm.target.find(".action-btn").addClass(elmt)
          })
          ajaxTableElm.target.find(".action-btn").html(ajaxTableElm.actionName)
          ajaxTableElm.target.find(".action-btn").each(i => {
            ajaxTableElm.target.find(".action-btn").eq(i).on("click", data[i], ajaxTableElm.action)
          })
        } else {
          var targetParent = ajaxTableElm.target.parent()
          targetParent.css("display","none")
          $(".nothing-display").remove()
          targetParent.parent().append("<p class='nothing-display'>Nothing to display</p>")
        }
      }
    })
  })
}

function removeA(arr) {
  var what, a = arguments, L = a.length, ax;
  while (L > 1 && arr.length) {
    what = a[--L];
    while ((ax = arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1);
    }
  }
  return arr;
}

function summonTable(loc,conf,callback) {
  // return "hello!"
  console.log("summoning!")
  var reqConf = ["url","method","id","firstCap"]
  var confKeys = Object.keys(conf)
  reqConf.forEach((a) => {
    if (!confKeys.includes(a)) {
      conf[a] = ""
    }
  })
  
  $.ajax({
    url: conf.url,
    method: conf.method,
    success: (data) => {
      console.log("location is", loc)
      loc.empty()
      function generateTableHead(conf,style) {
        return "<table style='"+ style + "' id='" + conf.id + "' class='table ajax-table' data-url='" + conf.url + "' data-method='" + conf.method + "'> <thead> <tr> "
      }
      function generateTableFoot() {
        if (conf.action) {
          return "<td>Action</td></tr></thead><tbody></tbody></table>"
        } else {
          return "</tr></thead><tbody></tbody></table>"
        }
      }
      try {
        var keys = Object.keys(data[0])
        var table = generateTableHead(conf)
        conf.ignore.forEach(ig => {
          removeA(keys, ig);
        })
        var addKey;
        keys.forEach(key => {
          if (conf.firstCap) {
            addKey = key.charAt(0).toUpperCase() + key.slice(1);
          } else {
            addKey = key
          }
          table += "<td data-tag='" + key + "'>" + addKey + "</td>"
        })
        table += generateTableFoot()
        loc.append(table);
        console.log("running callback")
        callback()
      } catch(err) {
        unsummoned.push([loc,conf,callback]);
        loc.append("<p>Nothing to display</p>")
      }
    }
  })
}

function retrySummon() {
  var toSummon = unsummoned;
  unsummoned = [];
  toSummon.forEach(table => {
    summonTable(table[0], table[1], table[2])
  })
}
