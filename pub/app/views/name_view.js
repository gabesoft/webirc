var NameView = Backbone.View.extend({
        initialize: function() {
            // TODO: refactor (same functionality exists in MessageView)
            var self   = this
              , offset = 180
              , w      = $(window);

            self.$el.height(w.height() - offset);

            w.resize(function() {
                var w = $(window);
                self.$el.height(w.height() - offset);
            });

            self.template = Mustache.compile($('#nick-template').html());
        }

      , render: function() {

        }

      , show: function(channel, names) {
            var self = this
              , el   = this.$el;

            el.empty();
            _.each(Object.keys(names), function(name) {
                var nick = name.replace(/^@/, '')
                  , html = self.template({ nick: nick });
                el.append(html);
            });
        }
    });
