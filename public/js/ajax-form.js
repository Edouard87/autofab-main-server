$.ajax({
    url: "/templates/status-msg.mustache",
    method: 'get',
    success: data => {
        const successmsg = data
        $(".ajax-form").submit(function (ev) {
          ev.preventDefault();
          $(".ajax-form").find(".dialogue-box").remove()
          $.ajax({
            url: $(this).attr("action"),
            method: $(this).attr("method"),
            data: $(this).serialize(),
            success: data => {
              console.log(data)
              console.log(Mustache.to_html(successmsg, data))
              $(".ajax-form").append(Mustache.to_html(successmsg, data))
              $(".ajax-form").trigger("success")
            }
          })
        });
    }
})

$(".ok-close-dialogue").on("click", function () {
  $(this).parent().remove();
});
