var flatiron = require('flatiron')
  , fs       = require('fs')
  , path     = require('path')
  , jade     = require('jade')
  , app      = flatiron.app;

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http);

app.router.get('/', function () {
    var indexFile    = path.join(__dirname, 'pub/views/index.jade')
      , layoutFile   = path.join(__dirname, 'pub/views/layouts/main.jade')
      , index        = fs.readFileSync(indexFile, 'utf8')
      , layout       = fs.readFileSync(layoutFile, 'utf8')
      , indexLocals  = {}
      , indexOpts    = {}
      , layoutLocals = {
            title: 'Web Chat'
          , javascript: ''
          , body: jade.compile(index, indexOpts)(indexLocals)
        }
      , layoutOpts = {}
      , html       = jade.compile(layout, layoutOpts)(layoutLocals);

    this.res.writeHead(200, { 'Content-Type': 'text/html' });
    this.res.end(html);
});

app.start(3000);
