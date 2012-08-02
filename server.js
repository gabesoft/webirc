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
    socket.emit('servermsg', { msg: 'the server says hi' });
    socket.on('clientmsg', function(data) {
        console.log(data);
    });

    var getClient = function(nick, callback) {
            console.log(nick, !!clients[nick]);
            if (!clients[nick]) {
                var client    = createIrcClient(nick);
                clients[nick] = client;

                client.id = nick;
                console.log('client created', nick, client.opt.nick, client.nick);

                client.on('raw', function(data) {
                    if (data.command !== 'PING' && data.command !== 'PONG') {
                        console.log('RAW', data);
                    }
                });

                client.on('registered', function(message) {
                    console.log('client registered', client.nick, client.id);
                });

                client.on('join', function(channel, nick, message) {
                    console.log(nick + ' has joined ' + channel, client.nick, nick, 'id', client.id);
                    if (client.nick === nick) {
                        socket.emit('join', { channel: channel, nick: nick, message: message });
                    }
                });

                client.on('message', function(nick, to, text, message) {
                    //console.log('message received', client.nick, nick, arguments[2], client.nick === nick);
                    console.log('message received: ', message, 'and sent to:', client.nick, 'from:', nick);
                    socket.emit('message', {
                        nick: nick
                      , to: to
                      , dest: client.nick
                      , text: text
                      , message: message
                    });
                });

                client.on('part', function(channel, nick, reason, message) {
                    console.log('part', nick, client.nick);
                    socket.emit('part', {
                        channel: channel
                      , nick: nick
                      , reason: reason
                      , message: message
                    });
                });

                client.on('motd', function() {
                    socket.emit('motd', arguments);
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

    socket.on('command', function(data) {
        // todo: make messages consistent across client and server
        getClient(data.nick, function(client) {
            switch(data.command) {
                case 'join':
                    client.nick = data.nick;
                    client.join(data.data);
                    break;
                case 'nick':
                    client.nick = data.nick;
                    break;
                case 'say':
                    client.say(data.target, data.data);
                    break;
                case 'part':
                    client.part(data.data);
                    break;
                default:
                    console.error('invalid command', data);
            }
        });
    });

    socket.on('join', function(data) {
        //console.log('joining', data);
        getClient(data.nick, function(client) {
            client.join(data.channel);
        });
    });

    socket.on('say', function(data) {
        console.log('saying', data);
        getClient(data.nick, function(client) {
            client.say(data.channel, data.text);
        });
    });

    socket.on('part', function(data) {
        console.log('parting', data);
        getClient(data.nick, function(client) {
            client.part(data.channel);
        });
    });
});
