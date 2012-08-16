var CommandView = Backbone.View.extend({
        events: {
            'keypress #command > input#command-input[type="text"]' : 'send'
        }

      , initialize: function() {
            this.nick    = 'notset';
            this.channel = '#dev';

            _.bindAll(this, 'send');
        }

      , render: function() {

        }

      , input: function() {
            return this.$el.find('#command-input');
        }

      , connect: function() {
            var el = this.input();
            el.removeClass('disconnected');
            el.addClass('connected');
        }

      , disconnect: function() {
            var el = this.input();
            el.removeClass('connected');
            el.addClass('disconnected');
        }

      , messageInput: function() {
            return this.$el.find('#message-input');
        }

      , nickInput: function() {
            return this.$el.find('#nick-input');
        }

      , send: function(e, keyCode) {
            var key   = keyCode || e.keyCode
              , input = this.input()
              , text  = input.val()
              , ENTER = 13
              , pat   = /^\/([a-z]+)(\s+(.*))?$/
              , cmd   = 'say'
              , data  = text
              , match = null;

            if (key !== ENTER || text === '') { return; }

            match = pat.exec(text);
            if (match !== null) {
                cmd  = match[1].toLowerCase();
                data = match[3];
            }

            switch(cmd) {
                case 'nick':
                    this.nick = data;
                    this.trigger('command', 'connect', this.nick);
                    break;
                case 'join':
                    this.trigger('command', 'join', data);
                    break;
                case 'part':
                    this.trigger('command', 'part', this.channel);
                    break;
                case 'say':
                    this.trigger('command', 'say', this.channel, data);
                    break;
                case 'quit':
                    this.trigger('command', 'quit', 'logging out');
                    break;
                default:
                    console.log('invalid command ' + cmd);
            }

            input.val('');
        }
    });
