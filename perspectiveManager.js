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
