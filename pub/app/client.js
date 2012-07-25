
$(document).ready(function() {
    var socket = io.connect();
    socket.on('servermsg', function(data) {
        console.log(data);
    });

    socket.on('message', function(data) {
        console.log('message', data);

        if (data.nick === 'snoop') {
            socket.emit('part', { channel: '#dev', nick: 'snoop' });
        }
        if (data.nick === 'laura') {
            socket.emit('part', { channel: '#dev', nick: 'laura' });
        }
    });

    socket.on('join', function(data) {
        console.log('join', data);

        if (data.nick === 'snoop') {
            socket.emit('say', { channel: '#dev', nick: 'snoop', text: "what up y'all" });
        }
        if (data.nick === 'laura') {
            socket.emit('say', { channel: '#dev', nick: 'laura', text: "morning superstars" });
        }
    });

    socket.on('part', function(data) {
        console.log('part', data);
    });

    socket.emit('clientmsg', { msg: 'client up and running' });

    socket.emit('join', { channel: '#dev', nick: 'snoop' });
    socket.emit('join', { channel: '#dev', nick: 'laura' });

    console.log('doc is ready');
});
