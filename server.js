var flatiron = require('flatiron')
  , fs       = require('fs')
  , path     = require('path')
  , jade     = require('jade')
  , IRC      = require('./lib/irc')
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
    var client = new IRC(socket, 'localhost');
    client.initialize();

    //socket.emit('servermsg', { msg: 'the server says hi' });
    //socket.on('clientmsg', function(data) {
        //console.log(data);
    //});
});
