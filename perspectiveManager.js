/**
  This class is the main entry point for external programs to use this library.
  It can be used as a static class as it has been already instantiated here.
  Users are discouraged from making another instance of this class in their program.

  NOTE that it is often recommended that you write and use your own manager
  class. However, make sure that the perspectiveTool objects and the snap
  object know about each other as demonstrated below.
*/

PerspectiveManager = new function() {
  var perspectives = [];
  var snap;
  var element;
  var divWidth;
  var divHeight;

  this.createPerspective = function() {
    // for (var i = 0; i < perspectives.length; i++) {
    //   perspectives[i].deactivate();
    // }

    var newPerspective = new pTool.PerspectiveTool();
    newPerspective.init(element, divWidth, divHeight);
    newPerspective.setDimensions(5.5, 3.5);
    snap.addPlane(newPerspective);
    perspectives.push(newPerspective);
    return newPerspective;
  }

  this.init = function(el, dw, dh) {
      element = el;
      divWidth = dw;
      divHeight = dh;
      snap = new Snap();
      var p = this.createPerspective();
      // this.newPerspective();

      return p;
  }
}
