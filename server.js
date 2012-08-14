var flatiron = require('flatiron')
  , fs       = require('fs')
  , path     = require('path')
  , jade     = require('jade')
  , IRC      = require('./lib/irc')
  , ecstatic = require('ecstatic')
  , app      = flatiron.app
  , io       = null
  , socket   = require('socket.io');

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
    (new IRC(socket, 'localhost')).initialize();
});
