
$(document).ready(function() {
    var socket      = io.connect()
      , commandView = new CommandView({ el: $('#command') })
      , messageView = new MessageView({ el: $('#messages') });

    // todo: adjust the chat view horizontally & vertically with the window

    commandView.on('command', function() {
        var args = Array.prototype.slice.apply(arguments)
          , len  = args.length;
        socket.emit.apply(socket, args);

        if (args[0] === 'say') {
            messageView.say(commandView.nick, args[len - 1]);
        }
    });

    socket.on('message', function(data) {
        if (data.dest === commandView.nick) {   // TODO: this should be taken care of on the server
            messageView.say(data.nick, data.text);
        }
    });

    socket.on('join', function(data) {
        // todo: ensure that the server fires events only to the appropriate clients
        commandView.channel = data.channel;
        messageView.say(data.nick, 'joined ' + data.channel);
    });

    socket.on('part', function(data) {
        messageView.say(data.nick, 'left ' + data.channel);
    });

    socket.on('motd', function(data) {
        console.log('motd', data);
    });

    socket.on('nick', function(nick) {
        commandView.nick = nick;
    });

    //socket.on('part', function(data) {
    //console.log('part', data);
    //});

    //socket.emit('clientmsg', { msg: 'client up and running' });

    //socket.emit('join', { channel: '#dev', nick: 'snoop' });
    //socket.emit('join', { channel: '#dev', nick: 'laura' });

    //console.log('doc is ready');
});
