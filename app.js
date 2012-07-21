var flatiron = require('flatiron')
  , fs       = require('fs')
  , path     = require('path')
  , jade     = require('jade')
  , irc      = require('irc')
  , app      = flatiron.app

  , createIrcClient =  function() {
        var port     = app.config.port || 6667
          , channels = []
          , hostname = 'localhost'
          , channel  = '#dev'
          , nick     = 'gabe'
          , client   = new irc.Client(hostname, nick, {
                userName: nick
              , realName: 'web irc client'
              , port: port
              , debug: false
              , showErrors: false
              , autoRejoin: true
              , autoConnect: true
              , channels: channels
                //, password: password
                //, secure: ssl
                //, selfSigned: selfSigned
              , certExpired: false
              , floodProtection: true
              , floodProtectionDelay: 1000
              , stripColors: true
            });

        return client;
    }

  , client = createIrcClient();

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http);

app.router.get('/', function () {
    var indexFile  = path.join(__dirname, 'pub/views/index.jade')
      , layoutFile = path.join(__dirname, 'pub/views/layouts/main.jade')
      , index      = fs.readFileSync(indexFile, 'utf8')
      , layout     = fs.readFileSync(layoutFile, 'utf8')
      , options    = {
            pretty: true
        }
      , indexLocals  = {}
      , layoutLocals = {
            title: 'Web Chat'
          , javascript: ''
          , body: jade.compile(index, options)(indexLocals)
        }
      , html       = jade.compile(layout, options)(layoutLocals);

    client.join('#dev');
    client.say('#dev', 'hello');
    client.part('#dev');

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(html);
});

app.start(3000);
