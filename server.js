var flatiron = require('flatiron')
  , fs       = require('fs')
  , path     = require('path')
  , jade     = require('jade')
  , irc      = require('irc')
  , ecstatic = require('ecstatic')
  , app      = flatiron.app
  , io       = null
  , socket   = require('socket.io')
  , clients  = {}

  , createIrcClient =  function(nick) {
        return new irc.Client('localhost', nick, {
            userName: nick                              // TODO: remove spaces from userName
          , realName: 'web irc client'
          , port: app.config.port || 6667
          , debug: false
          , showErrors: false
          , autoRejoin: false
          , autoConnect: false
          , channels: ['#dev']
          , password: null
          , secure: false
          , selfSigned: false
          , certExpired: false
          , floodProtection: true
          , floodProtectionDelay: 1000
          , stripColors: true
        });
    };

require('console-trace')({ always: true });

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http);
app.http.before = [
    ecstatic(__dirname + '/pub', {
        autoIndex: false
    })
];

app.router.get('/', function () {
    var indexFile  = path.join(__dirname, 'pub/views/index.jade')
      , layoutFile = path.join(__dirname, 'pub/views/layouts/main.jade')
      , index      = fs.readFileSync(indexFile, 'utf8')
      , layout     = fs.readFileSync(layoutFile, 'utf8')
      , options    = {
            pretty: true
          , filename: layoutFile
        }
      , indexLocals  = {}
      , layoutLocals = {
            title: 'Web Chat'
          , javascript: ''
          , body: jade.compile(index, options)(indexLocals)
        }
      , html = jade.compile(layout, options)(layoutLocals);

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(html);
});

app.start(3000);

io = socket.listen(app.server);

io.set('log level', 1);
io.sockets.on('connection', function(socket) {
    //var client = new IRC(socket, 'localhost');
    //client.initialize();
    // --------------------
    //socket.on('initialize', function() {
        //var id = util.uniqueId();
        //irc.initialize(id, socket);
        //socket.emit('initialize_success', id);
    //});

    //socket.on('connect', function(id, nick) {
        //// todo: create client here if not created
        //// if a client exists but with a different nick
        //// quit and destroy current client
        //// create a new client with the new nick
        //irc.connect(id, nick);
    //});

    //socket.on('disconnect', function(id) {
        //// on disconnect destroy the client 
        //irc.disconnect(id);
    //});
    // --------------------


    socket.emit('servermsg', { msg: 'the server says hi' });
    socket.on('clientmsg', function(data) {
        console.log(data);
    });

    //socket.on('initialize', function(id) {
    //// this could work to have a socket for each client
    //// the client would have to use the same namespace as well
    //// the id could be generated on the server as well
    //io
    //.of('/' + id)
    //.on('connection', function(socket) {
    //initializeConnection(id, socket);
    //});
    //});

    var send = function(clientNick, callback) {
            var nick       = clientNick
              , updateNick = function(oldNick, newNick, client) {
                    delete clients[oldNick];
                    clients[newNick] = client;
                    nick             = newNick;
                };

            // TODO: use nick to fire events only to the appropriate client
            //       the client should change it's nick on the 'nick' event
            //       so we need to change this nick too

            // TODO: move client setup to its own file

            if (!clients[nick]) {
                var client = createIrcClient(nick)
                  , emit   = function() {
                        var args = Array.prototype.slice.apply(arguments);

                        // TODO: remove this method and inline call to emit
                        //if (client.nick === nick) { // TODO: this check should not be necessary 
                        socket.emit.apply(socket, args);
                        //}
                    };

                clients[nick] = client;
                console.log('client created', nick, client.opt.nick, client.nick);

                client.on('raw', function(data) {
                    if (data.command !== 'PING' && data.command !== 'PONG') {
                        console.log('RAW', data);
                    }
                });

                client.on('join', function(channel, nick, message) {
                    // todo: on joining first check that the client has the specified channel
                    // client.chans[target] = {serverName: target, unread_messages: 0, unread_mentions: 0};
                    console.log(nick + ' has joined ' + channel, client.nick, nick);
                    emit('join', { channel: channel, nick: nick, message: message });
                });

                client.on('message', function(nick, to, text, message) {
                    console.log('message received: ', message, 'and sent to:', client.nick, 'from:', nick);
                    emit('message', {
                        nick: nick
                      , to: to
                      , dest: client.nick
                      , text: text
                      , message: message
                    });
                });

                client.on('part', function(channel, nick, reason, message) {
                    console.log('part', nick, client.nick);

                    emit('part', {
                        channel: channel
                      , nick: nick
                      , reason: reason
                      , message: message
                    });
                });

                client.on('motd', function() {
                    emit('motd', arguments);
                });

                client.on('registered', function(message) {
                    updateNick(nick, client.nick, client);
                    emit('nick', client.nick, message);
                });

                client.on('NICK', function(newNick) {
                    updateNick(client.nick, newNick, client);
                    emit('nick', newNick);
                });

                client.on('error', function(e) {
                    console.log(e);
                });

                client.connect(function() {
                    callback(client);
                });
            } else {
                callback(clients[nick]);
            }
        };

    //socket.on('command', function(data) {
    //send(data.nick, function(client) {
    //switch(data.command) {
    //case 'join':
    //client.nick = data.nick;
    //client.join(data.data);
    //break;
    //case 'nick':
    //client.nick = data.nick;
    //break;
    //case 'say':
    //client.say(data.target, data.data);
    //break;
    //case 'part':
    //client.part(data.data);
    //break;
    //default:
    //console.error('invalid command', data);
    //}
    //});
    //});

    socket.on('join', function(nick, channel) {
        console.log('join', arguments);
        send(nick, function(client) {
            client.join(channel);
        });
    });

    socket.on('part', function(nick, channel) {
        send(nick, function(client) {
            client.part(channel);
        });
    });

    socket.on('say', function(nick, channel, message) {
        console.log('say', arguments);
        send(nick, function(client) {
            client.say(channel, message);
        });
    });

    socket.on('connect', function(nick) {
        send(nick, function(client) {
            client.connect(10, function() {
                console.log('client ' + nick + ' connected', arguments);
            });
        });
    });

    socket.on('disconnect', function(nick, message) {
        send(nick, function(client) {
            client.disconnect(message || '', function() {
                console.log('client ' + nick + ' disconnected', arguments);
            });
        });
    });
});
