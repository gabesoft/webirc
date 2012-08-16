var MessageView = Backbone.View.extend({
        initialize: function() {

        }

      , render: function() {

        }

      , print: function(nick, text) {
            var el    = '<li>' + nick + ': ' + text + '</li>'
              , self  = this
              , first = this.$el.find('li:first')
              , count = this.$el.find('li').size();

            this.$el.append(el);
            this.$el.animate({ scrollTop: count * first.height() }, 500);
        }
    });
