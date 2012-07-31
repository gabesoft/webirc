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

      , messageInput: function() {
            return this.$el.find('#message-input');
        }

      , nickInput: function() {
            return this.$el.find('#nick-input');
        }

      , send: function(e, keyCode) {
            var key   = keyCode || e.keyCode
              , input = this.$el.find('#command-input')
              , text  = input.val()
              , ENTER = 13
              , pat   = /^!([a-z]+)\s+(.*)$/
              , cmd   = 'say'
              , data  = text
              , match = null;

            if (key !== ENTER || text === '') { return; }

            match = pat.exec(text);
            if (match !== null) {
                cmd  = match[1].toLowerCase();
                data = match[2];
            }

            if (cmd === 'nick') {
                this.nick = data;
            }
            else if (cmd === 'channel') {
                this.channel = data;
            } else {
                this.trigger('command', { 
                    nick: this.nick
                  , command: cmd
                  , target: this.channel    // todo: allow user to change channel
                  , data: data 
                });
            }

            input.val('');
        }
    });
