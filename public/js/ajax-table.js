function setupAjaxTable(tableConfig) {
  console.log($(".ajax-table").data("method"))
  $(".ajax-table tbody").empty();
  var query;
  try {
    query = tableConfig.preSend()
  } catch(err) {
    query = {}
  }
  $.ajax({
    url: $(".ajax-table").data("url"),
    method: $(".ajax-table").data("method"),
    context: $(".ajax-table .action-btn"),
    data: JSON.stringify(query),
    contentType: 'application/json',
    success: data => {
      console.log(data)
      console.log($(".ajax-table").data("url"))
      data.forEach((elmt) => {
        try {
          tableConfig.validator(elmt)
        } catch (err) {
          console.log("Ajax Table: No validators")
        }
      })
      var tRow = "<tr>"
      $(".ajax-table thead td[data-tag]").each(index => {
        tRow = tRow + "<td>{{" + $(".ajax-table thead td")[index].getAttribute("data-tag") + "}}</td>"
      })
      tRow += "<td><button "
      $(" .ajax-table thead td[data-tag]").each(index => {
        tRow += "data-" + $(".ajax-table thead td")[index].getAttribute("data-tag") +
          "='{{" + $(".ajax-table thead td")[index].getAttribute("data-tag") + "}}' "
      })
      tRow += " class='action-btn'>Manage</button></td></tr>"
      var tableRow = $(".ajax-table thead").html()
      data.forEach(element => {
        $(".ajax-table tbody").append(Mustache.to_html(tRow, element))
      });
      
      console.log("done!")
      console.log(tableConfig)
      console.log(data)
      console.log(data)
      tableConfig.actionClasses.forEach(elmt => {
        $(".ajax-table .action-btn").addClass(elmt)
      })
      $(".ajax-table .action-btn").html(tableConfig.actionName)
      $(".ajax-table .action-btn").each(i => {
        $(".ajax-table .action-btn").eq(i).on("click", data[i], tableConfig.action)
      })
    }
  })
}

