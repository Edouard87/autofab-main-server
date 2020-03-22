function leadingZeroes(num) {

  var digits = num.toString().length;
  if (digits < 2) {
    return ("0" + num).slice(-2);
  } else {
    return num
  }

}