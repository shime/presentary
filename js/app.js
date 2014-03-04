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
      p.resolve(Em.$.get(self.get("location")).then(function(response){
        self.set("content", response);
        return response;
      }));
    });
  }
});

App.Slide.reopenClass({
  findAll: function(){
    var self = this;
    return Em.Deferred.promise(function(p){
      if (self.loadedSlides === true) {
        p.resolve(self.slides);
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
      return slides.findBy('id', id);
    });
  }

});

App.SlidesRoute = Em.Route.extend({
  model: function(){
    return App.Slide.findAll();
  },
  setupController: function(controller, slides) {
    this._super(controller, slides);
    this.transitionTo("slides.show", slides.get("firstObject"));
  },
  actions: {
    goLeft: function(){
      var self = this;
      var currentId = this.controllerFor("slides.show").get("model.id");
      App.Slide.findById(currentId - 1).then(function(slide){
        if (slide) self.transitionTo("slides.show", slide);
      });
    },
    goRight: function(){
      var self = this;
      var currentId = this.controllerFor("slides.show").get("model.id");
      App.Slide.findById(currentId + 1).then(function(slide){
        if (slide) self.transitionTo("slides.show", slide);
        
      });
    }
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

App.SlidesShowView = Em.View.extend({
  keyDown: function(e){
    if (e.keyCode === 37){
      this.get("controller").send("goLeft");
    }
    if (e.keyCode === 39){
      this.get("controller").send("goRight");
    }
  },
  didInsertElement: function(){
    var self = this;
    setInterval(function(){
      self.$("#fake").focus();
    }, 1);
  },
  content: function(){
    var converter = new Markdown.Converter().makeHtml;
    return converter(this.get("controller.model.content"));
  }.property("controller.model.content")
});
