
$(document).ready(function() {
    var socket = io.connect();
    socket.on('servermsg', function(data) {
        console.log(data);
    });

    socket.emit('clientmsg', { msg: 'client up and running' });
    
    console.log('doc is ready');
});
