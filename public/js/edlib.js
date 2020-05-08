function formatDate(date) {
  var selectedDate = date.split("-")
  var yr = selectedDate[0]
  var month = selectedDate[1]
  var day = selectedDate[2]
  return month + "-" + day + "-" + yr
}

function deformatDate(date) {
  var selectedDate = date.split("-")
  var yr = selectedDate[2]
  var month = selectedDate[0]
  var day = selectedDate[1]
  return yr + "-" + month + "-" + day
}

function leadingZeroes(num) {

  var digits = num.toString().length;
  if (digits < 2) {
    return ("0" + num).slice(-2);
  } else {
    return num
  }

}

function firstCap(x) {
  return x.charAt(0).toUpperCase() + x.slice(1);
}