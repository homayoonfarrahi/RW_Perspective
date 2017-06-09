function AnchorSystem(boundaries) {
  this.anchorLines = [];
  this.boundaries = boundaries;
  this.minX = boundaries[0];
  this.maxX = boundaries[1];
  this.minY = boundaries[2];
  this.maxY = boundaries[3];

  this.addAnchorLine = function(circle1, circle2) {
    var anchorLine = new AnchorLine(circle1, circle2, this);
    anchorLine.setPaperInstance(this.paper);
    this.anchorLines.push(anchorLine);
  }

  this.isInsideBoundaries = function(p) {
    if (p.x >= this.minX && p.x <= this.maxX && p.y >= this.minY && p.y <= this.maxY) {
      return true;
    } else {
      return false;
    }
  }

  this.setPaperInstance = function(paper) {
    this.paper = paper;
  }

  this.getAnchorLinesForCircle = function(circle) {
    var result = [];
    for (var i=0 ; i<this.anchorLines.length ; i++) {
      if (this.anchorLines[i].circle1 === circle || this.anchorLines[i].circle2 === circle) {
        result.push(this.anchorLines[i]);
      }
    }

    return result;
  }

  this.update = function() {
    for (var i=0 ; i<this.anchorLines.length ; i++) {
      this.anchorLines[i].update();
    }
  }
}

function AnchorLine(circle1, circle2, anchorSystem) {
  this.circle1 = circle1;
  this.circle2 = circle2;
  this.anchorPoint1 = null;
  this.anchorPoint2 = null;
  this.path = null;
  this.anchorSystem = anchorSystem;

  this.computeAnchorPositions = function() {
    var anchors = [];
    var p1 = new Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
    var p2 = new Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
    if (this.anchorSystem.isInsideBoundaries(new Point2D(this.anchorSystem.minX, new Line(p1, p2).getYforX(this.anchorSystem.minX)))) {
      anchors.push(new Point2D(this.anchorSystem.minX, new Line(p1, p2).getYforX(this.anchorSystem.minX)));
    }

    if (this.anchorSystem.isInsideBoundaries(new Point2D(this.anchorSystem.maxX, new Line(p1, p2).getYforX(this.anchorSystem.maxX)))) {
      anchors.push(new Point2D(this.anchorSystem.maxX, new Line(p1, p2).getYforX(this.anchorSystem.maxX)));
    }

    if (this.anchorSystem.isInsideBoundaries(new Point2D(new Line(p1, p2).getXforY(this.anchorSystem.minY), this.anchorSystem.minY))) {
      anchors.push(new Point2D(new Line(p1, p2).getXforY(this.anchorSystem.minY), this.anchorSystem.minY));
    }

    if (this.anchorSystem.isInsideBoundaries(new Point2D(new Line(p1, p2).getXforY(this.anchorSystem.maxY), this.anchorSystem.maxY))) {
      anchors.push(new Point2D(new Line(p1, p2).getXforY(this.anchorSystem.maxY), this.anchorSystem.maxY));
    }

    if (anchors.length !== 2) {
      console.error('2 anchor points should be found for each line instead of: ' + anchors.length);
    }

    return anchors;
  }

  var p1 = new Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
  var p2 = new Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
  var anchors = this.computeAnchorPositions();
  var deltaP = p2.clone().subtract(p1);
  var deltaAnchor = anchors[1].clone().subtract(anchors[0]);
  if ((deltaP.x * deltaAnchor.x >= 0) && (deltaP.y * deltaAnchor.y >= 0)) {
    this.anchorPoint1 = new AnchorPoint(anchors[0], this.circle1, this);
    this.anchorPoint2 = new AnchorPoint(anchors[1], this.circle2, this);
  } else {
    this.anchorPoint1 = new AnchorPoint(anchors[1], this.circle1, this);
    this.anchorPoint2 = new AnchorPoint(anchors[0], this.circle2, this);
  }

  this.anchorPoint1.setPaperInstance(this.paper);
  this.anchorPoint2.setPaperInstance(this.paper);

  var pathString = 'M' + this.anchorPoint1.position.x + ',' + this.anchorPoint1.position.y;
  pathString += 'L' + this.anchorPoint2.position.x + ',' + this.anchorPoint2.position.y;
  this.path = paper.path(pathString);
  nonInteractableSet.push(this.path);

  this.setPaperInstance = function(paper) {
    this.paper = paper;
  }

  this.getCircleOppositeToAnchorPoint = function(anchorPoint) {
    if (anchorPoint === this.anchorPoint1) {
      return this.circle2;
    } else if (anchorPoint === this.anchorPoint2){
      return this.circle1;
    }

    console.error('The given anchor point should be one of the points of this anchor line');
  }

  this.getLine = function() {
    var p1 = new Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
    var p2 = new Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));

    return new Line(p1, p2);
  }

  this.update = function() {
    var p1 = new Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
    var p2 = new Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
    var anchors = this.computeAnchorPositions();
    var deltaP = p2.clone().subtract(p1);
    var deltaAnchor = anchors[1].clone().subtract(anchors[0]);
    if ((deltaP.x * deltaAnchor.x >= 0) && (deltaP.y * deltaAnchor.y >= 0)) {
      this.anchorPoint1.setPosition(anchors[0]);
      this.anchorPoint2.setPosition(anchors[1]);
    } else {
      this.anchorPoint1.setPosition(anchors[1]);
      this.anchorPoint2.setPosition(anchors[0]);
    }

    var pathString = 'M' + this.anchorPoint1.position.x + ',' + this.anchorPoint1.position.y;
    pathString += 'L' + this.anchorPoint2.position.x + ',' + this.anchorPoint2.position.y;
    this.path.attr('path', pathString);
  }
}

function AnchorPoint(point, circle, anchorLine) {
  this.associatedCircle = circle;
  this.position = point;
  this.anchorLine = anchorLine;

  this.handle = paper.circle(this.position.x, this.position.y, 15);

  this.handle.attr('fill', '#00f');
  this.handle.attr('opacity', 0.5);
  var initialHandlePos = undefined;
  this.handle.drag(
    function(dx, dy, x, y, event) {
      var oppositeCircle = this.anchorLine.getCircleOppositeToAnchorPoint(this);
      var lines = this.anchorLine.anchorSystem.getAnchorLinesForCircle(this.associatedCircle);
      var movementAnchorLine = null;
      for (var i=0 ; i<lines.length ; i++) {
        if (lines[i] !== this.anchorLine) {
          movementAnchorLine = lines[i];
          break;
        }
      }

      var p1 = initialHandlePos.clone().add(new Point2D(dx, dy));
      var p2 = new Point2D(oppositeCircle.circle.attr('cx'), oppositeCircle.circle.attr('cy'));
      var intersect = new Line(p1, p2).findIntersectWithLine(movementAnchorLine.getLine());
      this.associatedCircle.circle.attr('cx', intersect.x);
      this.associatedCircle.circle.attr('cy', intersect.y);
      this.associatedCircle.point.x = intersect.x;
      this.associatedCircle.point.y = intersect.y;
      this.anchorLine.update();
      updatePaths();
      updateFillerPath();
    }.bind(this),
    function (x, y, event) {
      this.handle.attr('fill', '#f00');
      initialHandlePos = new Point2D(this.handle.attr('cx'), this.handle.attr('cy'));
    }.bind(this),
    function (event) {
      this.handle.attr('fill', '#00f');
    }.bind(this),
  );
  anchorHandleSet.push(this.handle);

  this.setPaperInstance = function(paper) {
    this.paper = paper;
  }

  this.setPosition = function(pos) {
    this.position.setTo(pos);
    this.handle.attr('cx', this.position.x);
    this.handle.attr('cy', this.position.y);
  }
}
