$(document).ready(() => {
  $(".ajax-form").submit(function (ev) {
    ev.preventDefault();
    console.log("submitting...")
    $(".ajax-form").find(".dialogue-box").remove()
    $.ajax({
      url: $(this).attr("action"),
      method: $(this).attr("method"),
      data: $(this).serialize(),
      success: data => {
        console.log("success!")
        // console.log("recieved",data)
        $(".ajax-form").trigger("success", data)
         if (data.code == 0) {
          $(".ajax-form").trigger("next")
         } else {
          ajaxDialogue.show(data)
         }
      }
    })
  });
})

var ajaxForm = {
  submit: (selector) => {
    console.log("submitting...")
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
  },
  submitToAndAct: (config, selector,callback) => {
    $.ajax({
      url: config.url,
      method: config.method,
      data: selector.serialize(),
      success: data => {
        callback(data)
      }
    })
  }
}

$(".ok-close-dialogue").on("click", function () {
  $(this).parent().remove();
});
