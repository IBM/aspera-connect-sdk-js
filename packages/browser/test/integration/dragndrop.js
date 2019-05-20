// FIXME: Drag and drop problems in karma (works otherwise)
xdescribe("Drag and Drop", function() {
  // create drag and drop elements for tests
  var dummyElement = document.createElement("div");
  document.body.appendChild(dummyElement);
  var dummyElement = document.createElement("li");
  document.body.appendChild(dummyElement);
  
  describe("#setDragDropTargets", function() {
    var listener = function(){};
    // create drop target 
    // var el = document.createElement('div');
    // el.id = "test";
    // document.body.append(el)
    
    it("should return error if drag-drop not enabled", function() {
      var options = {};
      var err = asperaWeb.setDragDropTargets("#test", options, listener);
      
      expect(err.error.code).to.equal(-1);
      expect(err.error.internal_message).to.equal("Invalid request");
      expect(err.error.user_message).to.equal("Drop is not enabled in the initialization options, please instantiate Connect again with the dragDropEnabled option set to true.");  
    });
    
    it("should return error if listener is not a function", function() {
      var options = {};
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      var err = asperaWeb2.setDragDropTargets("#test", options, 2);
      
      expect(err.error.user_message).to.equal("You must provide a valid listener");
    });
    
    it("should return error if options is undefined", function() {
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      var err = asperaWeb2.setDragDropTargets("#test", null, listener);
      
      expect(err.error.user_message).to.equal("You must provide a valid options object");
    });
    
    it("should return error if selector not found", function() {
      var options = {};
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      var err = asperaWeb2.setDragDropTargets("#blah", options, listener);
      
      expect(err.error.user_message).to.equal("No valid elements for the selector given");
    });
    
    it("should return null on success", function() {
      var options = {};
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      // use common element to ensure it exists
      
      var res = asperaWeb2.setDragDropTargets("div", options, listener);
      
      expect(res).to.equal(null);
    });
    
    it("should GET /v6\/connect\/file\/dropped-files/ on #initSession", function() {
      var options = {};
      this.server.respondWith('GET', /connect\/file\/initialize-drag-drop/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      
      expect(this.server.lastRequest.method).to.equal("GET");
      expect(this.server.lastRequest.url).to.equal("https://local.connectme.us:43003/v6/connect/file/initialize-drag-drop");
      expect(this.server.lastRequest.requestHeaders).to.have.property("x-aspera-session-id");
    });
    
    it("should POST /v6\/connect\/file\/dropped-files/ on drop event", function() {
      var options = {};
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, listener);
      
      // simulate drag and drop event
      var dragSource = document.querySelector('li');
      var dropTarget = document.querySelector('li');
      dragMock.dragStart(dragSource).drop(dropTarget);
      
      expect(this.server.lastRequest.method).to.equal("POST");
      expect(this.server.lastRequest.url).to.equal("https://local.connectme.us:43003/v6/connect/file/dropped-files");
      expect(this.server.lastRequest.requestHeaders).to.have.property("x-aspera-session-id");
    });
    
    it("should POST /v6\/connect\/file\/dropped-files/ on drop event with file list", function() {
      var options = {};
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, listener);
      
      // simulate drag and drop event
      var dragSource = document.querySelector('li');
      var dropTarget = document.querySelector('li');
      dragMock.dragStart(dragSource).drop(dropTarget, function(evt){
         // Callback is called after creating the event but before dispatching it. So we'll
         // mock a file drop in the event. A callback with less than two parameters will only 
         // be called once for the primary ('drop') event
         evt.dataTransfer.files[0] = {
           "lastModifiedDate":"Wed Sep 24 12:22:02 2014",
           "name": "/Users/dwosk/Desktop/foo.txt",
           "size": 386,
           "type": "text/plain"
         };
      });
      
      var req = this.server.lastRequest.requestBody;
      // decrypt the request
      reqDecrypt = AW4.Utils.decrypt(req);
      reqDecrypt = AW4.crypt.aesjs.utils.utf8.fromBytes(reqDecrypt);
      expect(reqDecrypt).to.match(/"lastModifiedDate":"Wed Sep 24 12:22:02 2014"/);
      expect(reqDecrypt).to.match(/"name":"\/Users\/dwosk\/Desktop\/foo.txt"/);
      expect(reqDecrypt).to.match(/"size":386/);
      expect(reqDecrypt).to.match(/"type":"text\/plain"/);
    });
    
    it("listener should be called on drop event", function() {
      var options = {};
      var spyListener = sinon.spy(listener);
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, spyListener);
      
      // simulate drag and drop event
      var dragSource = document.querySelector('li');
      var dropTarget = document.querySelector('li');
      dragMock.dragStart(dragSource).drop(dropTarget);
      
      expect(spyListener.callCount).to.equal(1);
    });
    
    it("listener should be called on drop event with event and files fields", function() {
      var options = {};
      var spyListener = sinon.spy(listener);
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, spyListener);
      
      // simulate drag and drop event
      var dragSource = document.querySelector('li');
      var dropTarget = document.querySelector('li');
      dragMock.dragStart(dragSource).drop(dropTarget);
      
      expect(spyListener.lastCall.args[0]).to.have.property("files");
      expect(spyListener.lastCall.args[0]).to.have.property("event");
    });
    
    it("listener should not be called if options.drop=false", function() {
      var options = {"drop":false};
      var spyListener = sinon.spy(listener);
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, spyListener);
      
      // simulate drop event
      var dragSource = document.querySelector('li');
      var dropTarget = document.querySelector('li');
      dragMock.dragStart(dragSource).drop(dropTarget);
      
      expect(spyListener.callCount).to.equal(0);
    });
    
    it("listener should be called on dragOver event", function() {
      var options = {"dragOver":true};
      var spyListener = sinon.spy(listener);
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, spyListener);
      
      // simulate dragOver event
      var dragSource = document.querySelector('li');
      var hoverRegion = document.querySelector('li');
      dragMock.dragStart(dragSource).dragOver(hoverRegion);
      
      expect(spyListener.callCount).to.equal(1);
    });
    
    it("listener should not be called on dragOver event by default", function() {
      var options = {};
      var spyListener = sinon.spy(listener);
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, spyListener);
      
      // simulate dragOver event
      var dragSource = document.querySelector('li');
      var hoverRegion = document.querySelector('li');
      dragMock.dragStart(dragSource).dragOver(hoverRegion);
      
      expect(spyListener.callCount).to.equal(0);
    });
    
    it("listener should be called on dragEnter event", function() {
      var options = {"dragEnter":true};
      var spyListener = sinon.spy(listener);
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, spyListener);
      
      // simulate dragEnter event
      var dragSource = document.querySelector('li');
      var hoverRegion = document.querySelector('li');
      dragMock.dragEnter(hoverRegion);
      
      expect(spyListener.callCount).to.equal(1);
    });
    
    it("listener should not be called on dragEnter event by default", function() {
      var options = {};
      var spyListener = sinon.spy(listener);
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, spyListener);
      
      // simulate dragEnter event
      var hoverRegion = document.querySelector('li');
      dragMock.dragEnter(hoverRegion);
      
      expect(spyListener.callCount).to.equal(0);
    });
    
    it("listener should be called on dragLeave event", function() {
      var options = {"dragLeave":true};
      var spyListener = sinon.spy(listener);
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, spyListener);
      
      // simulate dragLeave event
      var hoverRegion = document.querySelector('li');
      dragMock.dragLeave(hoverRegion);
      
      expect(spyListener.callCount).to.equal(1);
    });
    
    it("listener should not be called on dragLeave event by default", function() {
      var options = {};
      var spyListener = sinon.spy(listener);
      this.server.respondWith('POST', /connect\/file\/dropped-files/, [200, { "Content-Type": "application/json" }, '{}']);
      var asperaWeb2 = new AW4.Connect({"dragDropEnabled":true});
      asperaWeb2.initSession();
      // use common element to ensure it exists
      var res = asperaWeb2.setDragDropTargets("div", options, spyListener);
      
      // simulate dragLeave event
      var hoverRegion = document.querySelector('li');
      dragMock.dragLeave(hoverRegion);
      
      expect(spyListener.callCount).to.equal(0);
    });
  });
  
});
