var MessageView = Backbone.View.extend({
        initialize: function() {

        }

      , render: function() {

        }

      , say: function(nick, text) {
            var el    = '<li>' + nick + ': ' + text + '</li>'
              , self  = this
              , first = this.$el.find('li:first')
              , count = this.$el.find('li').size();
            this.$el.append(el);

            this.$el.animate({
                scrollTop: count * first.height()
            }, 500, function() {
                self.$el.find('li:last').effect('highlight', {}, 500);
            });
        }
    });
