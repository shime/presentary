App = Ember.Application.create({
  LOG_TRANSITIONS: true
});

App.ApplicationView = Em.View.extend({
  classNames: ["main"]
});

App.Router.map(function(){
  this.resource("slides", function(){
    this.route("show", {path: ":id"});
  });
});

App.Router.reopen({
  enableLogging: true
});

App.ApplicationRoute = Em.Route.extend({
  redirect: function(){
    this.transitionTo("slides");
  }
})

App.Slide = Ember.Object.extend({
  loadMarkdown: function(){
    var self = this;
    return Em.Deferred.promise(function(p){
      if (self.get("content")) {
        p.resolve(self.get("content"));
      } else {
        p.resolve(Em.$.get(self.get("location")).then(function(response){
          self.set("content", response);
          return response;
        }));
      }
    });
  }
});

App.Slide.reopenClass({
  findAll: function(){
    var self = this;
    return Em.Deferred.promise(function(p){
      if (self.loadedSlides === true) {
        p.resolve(self.loadedSlides);
      } else {
        p.resolve(Em.$.get("/slides.json").then(function(response){
          var slides = Em.A();
          response.forEach(function(child){
            var slide = App.Slide.create({
              location: child.location,
              id: child.id
            });
            slides.pushObject(slide);
          });
          self.slides = slides;
          self.loadedSlides = true;
          return slides;
        }));
      }
    });
  },

  findById: function(id){
    return this.findAll().then(function(slides){
      return slides.findProperty('id', id);
    });
  }

});

App.SlidesRoute = Em.Route.extend({
  model: function(){
    return App.Slide.findAll();
  },
  setupController: function(controller, slides) {
    this.transitionTo("slides.show", slides.get("firstObject"));
  }
});

App.SlidesShowRoute = Em.Route.extend({
  model: function(params){
    return App.Slide.findById(params.id);
  },
  afterModel: function(model){
    return model.loadMarkdown().then(function(){
      return model;
    });
  }
});
