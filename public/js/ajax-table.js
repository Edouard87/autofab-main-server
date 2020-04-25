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
    setupAjaxTable()
  },
  refreshAll: () => {
    setupAjaxTable();
    retrySummon();
  },
  connect: (x,y) => {
    y.target = x;
    tableConfig.push(y)
    setupAjaxTable();
    // retrySummon();
  },
  summon: (x,y) => {
    summonTable(x,y)
  }
}

function setupAjaxTable() {
  console.log("running...")
  tableConfig.forEach((ajaxTableElm) => {
    try {
      if (ajaxTableElm.target.html() == undefined) {
        ajaxTableElm.target = $(".ajax-table")
      }
    } catch(err) {
      ajaxTableElm.target = $(".ajax-table")
    }
    ajaxTableElm.target.find("tbody").empty();
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
        data.forEach((elmt) => {
          try {
            ajaxTableElm.validator(elmt)
          } catch (err) {
            console.log("Ajax Table: No validators")
          }
        })
        var tRow = "<tr>"
        ajaxTableElm.target.find("thead td[data-tag]").each(index => {
          tRow = tRow + "<td>{{" + ajaxTableElm.target.find("thead td")[index].getAttribute("data-tag") + "}}</td>"
        })
        tRow += "<td><button "
        ajaxTableElm.target.find("thead td[data-tag]").each(index => {
          tRow += "data-" + ajaxTableElm.target.find("thead td")[index].getAttribute("data-tag") +
            "='{{" + ajaxTableElm.target.find("thead td")[index].getAttribute("data-tag") + "}}' "
        })
        tRow += " class='action-btn'>Manage</button></td></tr>"
        console.log("data",data)
        data.forEach(element => {
          ajaxTableElm.target.find("tbody").append(Mustache.to_html(tRow, element))
        });
        ajaxTableElm.actionClasses.forEach(elmt => {
          ajaxTableElm.target.find(".action-btn").addClass(elmt)
        })
        ajaxTableElm.target.find(".action-btn").html(ajaxTableElm.actionName)
        console.log("Data--",data)
        ajaxTableElm.target.find(".action-btn").each(i => {
          console.log("i",i)
          console.log("data II",data[i])
          ajaxTableElm.target.find(".action-btn").eq(i).on("click", data[i], ajaxTableElm.action)
          console.log(ajaxTableElm.target.find(".action-btn").length)
          console.log(data.length)
        })
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

function summonTable(loc,conf) {
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
      loc.empty()
      function generateTableHead(conf,style) {
        return "<table style='"+ style + "' id='" + conf.id + "' class='machines-table ajax-table' data-url='" + conf.url + "' data-method='" + conf.method + "'> <thead> <tr> "
      }
      function generateTableFoot() {
        return "<td>Action</td></tr></thead><tbody></tbody></table>"
      }
      try {
        console.log(data)
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
        loc.append(table)
        if (conf.connect instanceof Object) {
          console.log("connecting...")
          ajaxTable.connect($("#" + conf.id), conf.connect)
        }
        return true
      } catch(err) {
        unsummoned.push([loc,conf])
        console.log(unsummoned)
        loc.append("<p>Nothing to display</p>")
        console.error(err)
        return false
      }
    }
  })
}

function retrySummon() {
  unsummoned.forEach(table => {
    if (summonTable(table[0], table[1])) {
      successSummon.push(table);
      console.log("summon success")
    }
  })
}
