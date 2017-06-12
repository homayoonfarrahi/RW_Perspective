function Grid(a, b, c, d, abFeet, bcFeet, paper) {
  this.a = a;
  this.b = b;
  this.c = c;
  this.d = d;
  this.abFeet = abFeet;
  this.bcFeet = bcFeet;
  this.paper = paper;

  this.horizontalPaths = this.paper.set();
  this.verticalPaths = this.paper.set();

  this.plane = undefined;

  this.makeGridLines = function(line1, line2, footSize, pathSet){
    startPoints = line1.getSegmentPoints(footSize);
    endPoints = line2.getSegmentPoints(footSize);

    if (startPoints.length !== endPoints.length) {
      console.error('Both lines should have been segmented into equal parts, not '
                    + startPoints.length + ' and ' + endPoints.length);
    }

    for (var i = 0 ; i < startPoints.length ; i++) {
      var startScreenPoint = this.plane.uvToScreen(startPoints[i].x, startPoints[i].y);
      var endScreenPoint = this.plane.uvToScreen(endPoints[i].x, endPoints[i].y);

      var pathString = 'M' + startScreenPoint.x + ',' + startScreenPoint.y;
      pathString += 'L' + endScreenPoint.x + ',' + endScreenPoint.y;

      var path = this.paper.path(pathString);
      pathSet.push(path);
    }
  }

  this.removePaths = function(pathSet) {
    pathSet.forEach(function(path) {
      path.remove();
    });
    pathSet.clear();
  }

  this.update = function() {
    this.plane = new Plane(this.a.clone(), this.b.clone(), this.c.clone(), this.d.clone(), 300, 300);
    var aUV = this.plane.screenToUV(this.a.x, this.a.y);
    var bUV = this.plane.screenToUV(this.b.x, this.b.y);
    var cUV = this.plane.screenToUV(this.c.x, this.c.y);
    var dUV = this.plane.screenToUV(this.d.x, this.d.y);

    this.removePaths(this.horizontalPaths);
    this.makeGridLines(new Line(aUV, bUV), new Line(dUV, cUV), this.abFeet, this.horizontalPaths);

    this.removePaths(this.verticalPaths);
    this.makeGridLines(new Line(aUV, dUV), new Line(bUV, cUV), this.bcFeet, this.verticalPaths);
  }

  this.update();
}
