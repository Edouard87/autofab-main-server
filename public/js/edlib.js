function formatDate(date) {
  var selectedDate = date.split("-")
  var yr = selectedDate[0]
  var month = selectedDate[1]
  var day = selectedDate[2]
  return month + "-" + day + "-" + yr
}
