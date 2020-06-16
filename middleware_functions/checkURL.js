module.exports = function(pages, req) {
  var check = false;
  pages.forEach(page => {
    if (page.strict) {
      if (req.url == page.name) {
        check = true
      }
    } else {
      if (req.url.includes(page.name) || page.name.includes(req.url)) {
        console.log("FOUND IT!")
        check = true
      }
    }
  })
  return check
}