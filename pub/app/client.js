
$(document).ready(function() {
    var socket      = io.connect()
      , id          = null
      , commandView = new CommandView({ el: $('#command') })
      , messageView = new MessageView({ el: $('#messages') });

    // todo: adjust the chat view horizontally & vertically with the window
    // todo: get rid of id if possible (at least on the client)

    socket.emit('initialize');
    socket.on('initialized', function(cid) {
        console.log('initialized', cid, id);
        id = cid;
    });

    socket.on('not-initialized', function(cid) {
        console.log('a client with id ' + cid + ' was not initialized');
    });

    commandView.on('command', function() {
        var args = Array.prototype.slice.apply(arguments)
          , len  = args.length;

        args.splice(1, 0, id);

        console.log('command', args);
        socket.emit.apply(socket, args);

        if (args[0] === 'say') {
            messageView.print(commandView.nick, args[len]);
        }
    });

    socket.on('message', function(cid, from, to, text, message) {
        console.log('client-onmessage', arguments);
        if (cid === id) {
            messageView.print(from, text);
        }
    });

    socket.on('join', function(cid, channel, nick, message) {
        console.log('client-onjoin', arguments);
        if (cid === id) {
            commandView.channel = channel;
            messageView.print(nick, 'joined ' + channel);
        }
    });

    socket.on('part', function(cid, channel, nick) {
        console.log('client-onpart', arguments);
        if (cid === id) {
            commandView.channel = 'not-set';
            messageView.print(nick, 'left ' + channel);
        }
    });

    socket.on('motd', function(data) {
        console.log('motd', data);
    });

    socket.on('nick', function(nick) {
        commandView.nick = nick;
    });

    socket.on('connect', function(cid) {
        console.log('connected', id);
        if (cid === id) {
            commandView.connect();
        }
    });

    socket.on('quit', function(cid, message) {
        if (cid === id) {
            messageView.print(commandView.nick, message);
            commandView.disconnect();
        }
    });

    socket.on('registered', function(cid, data) {
        if (cid === id) {
            messageView.print(data.nick, data.args.join(' '));
        }
    });
});
