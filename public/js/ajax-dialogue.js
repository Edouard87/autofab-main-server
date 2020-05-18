var ajaxDialogue = {
    init: () => {
        $('#status-modal').modal()
    },
    show: (msg) => {
        $('#status-modal .modal-title').html(msg.header)
        $('#status-modal .modal-body').html(msg.msg)
        $('#status-modal').modal('open')
    },
    onClose: (callback) => {
        $("#close-ajax-dialogue").on('click',()=>{
            callback();
        })
    }
}


