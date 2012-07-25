var flatiron = require('flatiron')
  , fs       = require('fs')
  , path     = require('path')
  , jade     = require('jade')
  , irc      = require('irc')
  , ecstatic = require('ecstatic')
  , app      = flatiron.app
  , io       = null
  , socket   = require('socket.io')

  , createIrcClient =  function(nick) {
        return new irc.Client('localhost', nick, {
            userName: nick                              // TODO: remove spaces from userName
          , realName: 'web irc client'
          , port: app.config.port || 6667
          , debug: false
          , showErrors: false
          , autoRejoin: true
          , autoConnect: false
          , channels: []
          , password: null
          , secure: false
          , selfSigned: false
          , certExpired: false
          , floodProtection: true
          , floodProtectionDelay: 1000
          , stripColors: true
        });
    };

require('console-trace')({
    always: true
});

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

    var clients = {}
      , getClient = function(nick, callback) {
            console.log(nick, !!clients[nick]);
            if (!clients[nick]) {
                var client    = createIrcClient(nick);
                clients[nick] = client;

                client.on('join', function(channel, nick, message) {
                    console.log(nick + ' has joined ' + channel, client.nick, nick);
                    if (client.nick === nick) {
                        socket.emit('join', { channel: channel, nick: nick, message: message });
                    }
                });

                client.on('message', function(nick, to, text, message) {
                    console.log('message received', arguments);
                    socket.emit('message', {
                        nick: nick
                      , to: to
                      , text: text
                      , message: message
                    });
                });

                client.on('part', function(channel, nick, reason, message) {
                    socket.emit('part', {
                        channel: channel
                      , nick: nick
                      , reason: reason
                      , message: message
                    });
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
