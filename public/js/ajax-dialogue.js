var ajaxDialogue = {
    show: (msg) => {
        $('#status-modal .modal-title').html(msg.header)
        $('#status-modal .modal-body').html(msg.msg)
        $('#status-modal').modal('toggle')
    }
}


