
$(document).ready(function() {
    var socket      = io.connect()
      , commandView = new CommandView({ el: $('#command') })
      , messageView = new MessageView({ el: $('#messages') });

    commandView.on('command', function(data) {
        socket.emit('command', data);
        if (data.command === 'say') {
            messageView.say(data.nick, data.data);
        }
    });

    //commandView.on('message', function(nick, text) {
        //socket.emit('say', { channel: '#dev', nick: nick, text: text });
        //messageView.message(nick, text);
    //});

    //commandView.on('nick-change', function(nick) {
        //socket.emit('join', { channel: '#dev', nick: nick });
    //});

    //socket.on('servermsg', function(data) {
        //console.log(data);
    //});

    socket.on('message', function(data) {
        console.log('message', data);
        messageView.say(data.nick, data.text);
    });

    socket.on('join', function(data) {
        console.log('join', data);
    });

    socket.on('part', function(data) {
        console.log('part', data);
    });

    //socket.on('part', function(data) {
        //console.log('part', data);
    //});

    //socket.emit('clientmsg', { msg: 'client up and running' });

    //socket.emit('join', { channel: '#dev', nick: 'snoop' });
    //socket.emit('join', { channel: '#dev', nick: 'laura' });

    //console.log('doc is ready');
});
