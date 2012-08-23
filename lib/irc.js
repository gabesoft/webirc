var u    = require('underscore')
  , util = require('./util')
  , irc  = require('irc');

function IRC(socket, server, options) {
    if (!(this instanceof IRC)) { return new IRC(socket, server, options); }

    this.socket  = socket;
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
    var socket   = this.socket
      , self     = this
      , commands = [ 'join', 'part', 'say' ]
      , fail = function(id) {
            socket.emit('not-initialized', id);
        };

    socket.on('initialize', function() {
        var id = util.uniqueId();
        self.clients[id] = self.createClient(id);

        console.log('initialized', id);
        socket.emit('initialized', id);
    });

    socket.on('connect', function(id, nick) {
        self.connect(id, nick, fail);
    });

    socket.on('quit', function(id, message) {
        self.disconnect(id, message, function() {
            socket.emit('quit', id, message);
        }, fail);
    });

    commands.forEach(function(command) {
        socket.on(command, function() {
            var args = util.toArray(arguments)
              , id   = args[0]
              , rest = args.slice(1);

            console.log('command:', command, id, rest);
            self.runIf(id, function(client) {
                client[command].apply(client, rest);
            }, fail);
        });
    });
};

IRC.prototype.run = function(id, callback) {
    var client = this.clients[id]
      , msg    = util.str.sprintf('A client with id %s has not been initialized.', id);
    if (!client) {
        throw new Error(msg);
    } else {
        callback(client);
    }
};

IRC.prototype.runIf = function(id, success, fail) {
    var client = this.clients[id];
    if (client) {
        success(client);
    } else {
        fail(id);
    }
};

IRC.prototype.connect = function(id, nick, fail) {
    var self = this;
    this.runIf(id, function(client) {
        client.opt.nick     = nick;
        client.opt.userName = nick;
        client.connect(self.retries);
    }, fail);
};

IRC.prototype.disconnect = function(id, message, callback, fail) {
    this.runIf(id, function(client) {
        client.disconnect(message, callback);
    }, fail);
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

            console.log('event received', ev, args);
            //if (ev === 'join' && !client.chans[args[2]]) {
            //console.log('HAD TO CREATE CHANNEL', ev, args);
            //client.chanData(args[0], true);
            //}

            self.socket.emit.apply(self.socket, args);
        });
    });

    return client;
};
