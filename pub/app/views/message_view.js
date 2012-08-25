var MessageView = Backbone.View.extend({
        initialize: function() {
            var self   = this
              , offset = 180
              , w      = $(window);

            self.$el.height(w.height() - offset);

            w.resize(function() {
                var w = $(window);
                self.$el.height(w.height() - offset);
            });

            self.template = Mustache.compile($('#message-template').html());
        }

      , render: function() {

        }

      , print: function(nick, text) {
            // TODO: show nicks in different colors
            var html  = this.template({ nick: nick, text: text })
              , self  = this
              , first = this.$el.find('li:first')
              , count = this.$el.find('li').size();

            this.$el.append(html);
            this.$el.animate({ scrollTop: count * first.height() }, 500);
        }
    });
