function statusMsg(msg) {
    $.ajax({
      url: "/templates/dialogue-msg.mustache",
      method: "get",
      success: dialogue => {
        $("body").append(Mustache.to_html(dialogue, msg))
      }
    })
}

