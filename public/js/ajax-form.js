$(".ajax-form").submit(function (ev) {
  ev.preventDefault();
  $(".ajax-form").find(".dialogue-box").remove()
  $.ajax({
    url: $(this).attr("action"),
    method: $(this).attr("method"),
    data: $(this).serialize(),
    success: data => {
      $(".ajax-form").trigger("success")
    }
  })
});

var ajaxForm = {
  submit: (selector) => {
    $.ajax({
      url: selector.attr("action"),
      method: selector.attr("method"),
      data: selector.serialize(),
      success: data => {
        selector.trigger("success")
        console.log(data)
        ajaxDialogue.show(data)
      }
    })
  },
  submitTo: (config,selector) => {
    $.ajax({
      url: config.url,
      method: config.method,
      data: selector.serialize(),
      success: data => {
        console.log(data)
        ajaxDialogue.show(data)
      }
    })
  }
}

$(".ok-close-dialogue").on("click", function () {
  $(this).parent().remove();
});
