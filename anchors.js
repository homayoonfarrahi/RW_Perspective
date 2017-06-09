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

  var p1 = new Point2(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
  var p2 = new Point2(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));

  this.computeAnchorPositions = function() {
    var anchors = [];
    var p1 = new Point2(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
    var p2 = new Point2(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
    if (this.anchorSystem.isInsideBoundaries(new Point2(this.anchorSystem.minX, new Line(p1, p2).getYforX(this.anchorSystem.minX)))) {
      anchors.push(new Point2(this.anchorSystem.minX, new Line(p1, p2).getYforX(this.anchorSystem.minX)));
    }

    if (this.anchorSystem.isInsideBoundaries(new Point2(this.anchorSystem.maxX, new Line(p1, p2).getYforX(this.anchorSystem.maxX)))) {
      anchors.push(new Point2(this.anchorSystem.maxX, new Line(p1, p2).getYforX(this.anchorSystem.maxX)));
    }

    if (this.anchorSystem.isInsideBoundaries(new Point2(new Line(p1, p2).getXforY(this.anchorSystem.minY), this.anchorSystem.minY))) {
      anchors.push(new Point2(new Line(p1, p2).getXforY(this.anchorSystem.minY), this.anchorSystem.minY));
    }

    if (this.anchorSystem.isInsideBoundaries(new Point2(new Line(p1, p2).getXforY(this.anchorSystem.maxY), this.anchorSystem.maxY))) {
      anchors.push(new Point2(new Line(p1, p2).getXforY(this.anchorSystem.maxY), this.anchorSystem.maxY));
    }

    if (anchors.length !== 2) {
      console.error('2 anchor points should be found for each line instead of: ' + anchors.length);
    }

    return anchors;
  }

  var anchors = this.computeAnchorPositions();
  for (var i=0 ; i<anchors.length ; i++) {
    var distance1 = anchors[i].distanceFromPoint(p1);
    var distance2 = anchors[i].distanceFromPoint(p2);
    var anchorPoint = null;
    if (distance1 <= distance2) {
      anchorPoint = new AnchorPoint(anchors[i], this.circle1, this);
      anchorPoint.setPaperInstance(this.paper);
      this.anchorPoint1 = anchorPoint;
    } else {
      anchorPoint = new AnchorPoint(anchors[i], this.circle2, this);
      anchorPoint.setPaperInstance(this.paper);
      this.anchorPoint2 = anchorPoint;
    }
  }

  var pathString = 'M' + this.anchorPoint1.position.x + ',' + this.anchorPoint1.position.y;
  pathString += 'L' + this.anchorPoint2.position.x + ',' + this.anchorPoint2.position.y;
  this.path = paper.path(pathString);

  this.setPaperInstance = function(paper) {
    this.paper = paper;
  }

  this.getCircleOppositeToAnchorPoint = function(anchorPoint) {
    var circleCenter1 = new Point2(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
    var circleCenter2 = new Point2(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
    var distance1 = anchorPoint.position.distanceFromPoint(circleCenter1);
    var distance2 = anchorPoint.position.distanceFromPoint(circleCenter2);

    if (distance1 <= distance2) {
      return this.circle2;
    } else {
      return this.circle1;
    }
  }

  this.getLine = function() {
    var p1 = new Point2(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
    var p2 = new Point2(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));

    return new Line(p1, p2);
  }

  this.update = function() {
    var p1 = new Point2(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
    var p2 = new Point2(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
    var anchors = this.computeAnchorPositions();
    for (var i=0 ; i<anchors.length ; i++) {
      var distance1 = anchors[i].distanceFromPoint(p1);
      var distance2 = anchors[i].distanceFromPoint(p2);
      if (distance1 <= distance2) {
        this.anchorPoint1.setPosition(anchors[i]);
      } else {
        this.anchorPoint2.setPosition(anchors[i]);
      }
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

      var p1 = initialHandlePos.clone().add(new Point2(dx, dy));
      var p2 = new Point2(oppositeCircle.circle.attr('cx'), oppositeCircle.circle.attr('cy'));
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
      initialHandlePos = new Point2(this.handle.attr('cx'), this.handle.attr('cy'));
    }.bind(this),
    function (event) {
      this.handle.attr('fill', '#00f');
    }.bind(this),
  );

  this.setPaperInstance = function(paper) {
    this.paper = paper;
  }

  this.setPosition = function(pos) {
    this.position.setTo(pos);
    this.handle.attr('cx', this.position.x);
    this.handle.attr('cy', this.position.y);
  }
}
