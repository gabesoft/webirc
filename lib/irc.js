var u    = require('underscore')
  , util = require('./util')
  , irc  = require('irc');

function IRC(socket, server, options) {
    if (!(this instanceof IRC)) { return new IRC(socket, server, options); }

    var self     = this
      , commands = [ 'join', 'part', 'say' ];

    this.server  = server || 'localhost';
    this.clients = {};
    this.retries = 5;
    this.options = u.extend({
        nick: 'not set'
      , userName: 'not set'
      , realName: 'web irc client'
      , port: 6667
      , debug: false
      , showErrors: false
      , autoRejoin: false
      , autoConnect: false
      , channels: []
      , password: null
      , secure: false
      , selfSigned: false
      , certExpired: false
      , floodProtection: true
      , floodProtectionDelay: 1000
      , stripColors: true
    }, options || {});
}

module.exports = IRC;

IRC.prototype.initialize = function() {
    socket.on('initialize', function() {
        var id = util.uniqueId();
        self.clients[id] = self.createClient(id);
        socket.emit('initialized', id);
    });

    socket.on('connect', function(id, nick) {
        self.connect(id, nick);
    });

    socket.on('disconnect', function(id) {
        self.disconnect(id);
    });

    commands.forEach(function(command) {
        socket.on(command, function() {
            var args = util.toArray(arguments)
              , id   = args[0]
              , rest = args.slice(1);

            self.run(id, function(client) {
                client.send.apply(client, rest);
            });
        });
    });
};

IRC.prototype.run = function(id, callback) {
    var client = this.clients[id]
      , msg    = util.sprintf('A client with id %s has not been initialized.', id);
    if (!client) {
        throw new Error(msg);
    } else {
        callback(client);
    }
};

IRC.prototype.connect = function(id, nick) {
    var self = this;
    this.run(id, function(client) {
        client.opt.nick     = nick;
        client.opt.userName = nick;
        client.connect(self.retries);
    });
};

IRC.prototype.disconnect = function(id) {
    this.run(id, function(client) {
        client.disconnect();
    });
};

IRC.prototype.createClient = function(id) {
    var client = new irc.Client(this.server, id, this.options)
      , self   = this
      , events = [ 'connect', 'QUIT', 'join', 'part', 'registered', 'NICK', 'message', 'motd' ];

    client.on('error', function(e) {
        console.error(e);
    });

    events.forEach(function(ev) {
        client.on(ev, function() {
            var args = util.toArray(arguments);
            args.unshift(id);
            args.unshift(ev);
            self.socket.emit.apply(self.socket, args);
        });
    });
};

//IRC.prototype.createClient = function(nick, options) {
//if (this.clients[nick]) { return this.clients[nick]; }

//var opts   = u.extend(this.options, {})
//, self   = this
//, client = null

//, updateNick = function(oldNick, newNick) {
//delete self.clients[oldNick];
//self.clients[newNick] = client;
//}

//, handle = function(ev, evName, callback) {
//client.on(ev, function() {
//var args = util.toArray(arguments)
//, name = util.sprintf('%s::%s', client.nick, evName || ev);
//args.unshift(name);
//this.emit.apply(this, args);
//callback.apply(arguments);
//});
//};

//opts.userName = nick;
//opts          = u.extend(opts, options || {});
//client        = new irc.Client(this.server, nick, opts);

//handle('join');
//handle('part');
//handle('motd');
//handle('message');
//handle('error', function(e) {
//console.log(e);
//});
//handle('registered', 'nick', function(message) {
//updateNick(nick, client.nick);
//});
//handle('NICK', 'nick', function(newNick) {
//updateNick(client.nick, newNick);
//});

//this.clients[nick] = client;
//return client;
//};
