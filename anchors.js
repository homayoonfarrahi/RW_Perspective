
function AnchorSystem(boundaries, circles, perspectiveTool, paper) {
  this.anchorLines = [];
  this.boundaries = boundaries;
  this.circles = circles;
  this.minX = boundaries[0];
  this.maxX = boundaries[1];
  this.minY = boundaries[2];
  this.maxY = boundaries[3];
  this.perspectiveTool = perspectiveTool;
  this.paper = paper;

  setCursor = function (cursor) {
    setTimeout("document.body.style.cursor = '" + cursor + "'", 0);
  }

  this.addAnchorLine = function (circle1, circle2) {
    var anchorLine = new AnchorLine(circle1, circle2, this);
    this.anchorLines.push(anchorLine);
  }

  this.isInsideBoundaries = function (p) {
    if (p.x >= this.minX && p.x <= this.maxX && p.y >= this.minY && p.y <= this.maxY) {
      return true;
    } else {
      return false;
    }
  }

  this.isCloseToRegion = function (p, maxDistance) {
    if (p.x >= this.minX - maxDistance && p.x <= this.maxX + maxDistance
      && p.y >= this.minY - maxDistance && p.y <= this.maxY + maxDistance) {
      return true;
    } else {
      return false;
    }
  }

  this.setPaperInstance = function (paper) {
    this.paper = paper;
  }

  this.getAnchorLinesForCircle = function (circle) {
    var result = [];
    for (var i = 0; i < this.anchorLines.length; i++) {
      if (this.anchorLines[i].circle1 === circle || this.anchorLines[i].circle2 === circle) {
        result.push(this.anchorLines[i]);
      }
    }

    return result;
  }

  this.getMovementDirection = function (anchorPoint) {
    if (anchorPoint.position.x === this.minX || anchorPoint.position.x === this.maxX) {
      return 'vertical';
    } else if (anchorPoint.position.y === this.minY || anchorPoint.position.y === this.maxY) {
      return 'horizontal';
    }
  }

  this.addAnchorHandlesToSet = function (set) {
    for (var i = 0; i < this.anchorLines.length; i++) {
      this.anchorLines[i].addAnchorHandlesToSet(set);
    }
  }

  this.addAnchorLinesToSet = function (set) {
    for (var i = 0; i < this.anchorLines.length; i++) {
      this.anchorLines[i].addAnchorLinesToSet(set);
    }
  }

  this.isCirclePositionInvalid = function(circle, newPos) {
    var i = 0;
    for (i = 0 ; i < circles.length ; i++) {
      if (circles[i] === circle) {
        break;
      }
    }

    var positions = [circles[0].point, circles[1].point, circles[2].point, circles[3].point];
    positions[i] = newPos;

    var crossProductZs = [];
    for (var index = 0; index < positions.length; index++) {
      var prevIndex = (index + positions.length - 1) % positions.length;
      var nextIndex = (index + 1) % positions.length;

      var vec1 = positions[prevIndex].clone().subtract(positions[index]);
      var vec2 = positions[nextIndex].clone().subtract(positions[index]);

      var crossProductZ = (vec1.x * vec2.y) - (vec1.y * vec2.x);
      crossProductZs.push(crossProductZ);
    }

    for (var i = 0 ; i < crossProductZs.length - 1 ; i++) {
      if (crossProductZs[i] * crossProductZs[i + 1] < 0) {
        return true;
      }
    }

    return false;
  }

  this.update = function () {
    for (var i = 0; i < this.anchorLines.length; i++) {
      this.anchorLines[i].update();
    }
  }

  this.addAnchorLine(circles[0], circles[1]);
  this.addAnchorLine(circles[1], circles[2]);
  this.addAnchorLine(circles[2], circles[3]);
  this.addAnchorLine(circles[3], circles[0]);
}

function AnchorLine(circle1, circle2, anchorSystem) {
  this.circle1 = circle1;
  this.circle2 = circle2;
  this.anchorPoint1 = null;
  this.anchorPoint2 = null;
  this.path1wide = null;
  this.path1narrow = null;
  this.path2wide = null;
  this.path2narrow = null;
  this.middlePath = null;
  this.anchorSystem = anchorSystem;
  this.perspectiveTool = anchorSystem.perspectiveTool;
  this.paper = anchorSystem.paper;

  this.computeAnchorPositions = function () {
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

    // remove duplicate anchor points
    if (anchors.length !== 2 && anchors.length !== 0) {
      for (var i = 0; i < anchors.length; i++) {
        for (var j = i + 1; j < anchors.length; j++) {
          if (anchors[i].x === anchors[j].x && anchors[i].y === anchors[j].y) {
            anchors.splice(j, 1);
            j = i + 1;
          }
        }
      }
    }

    if (anchors.length !== 2 && anchors.length !== 0) {
      console.error('only 0 or 2 anchors are accepted, not ' + anchors.length);
    }

    return anchors;
  }

  this.setPaperInstance = function (paper) {
    this.paper = paper;
  }

  this.getCircleOppositeToAnchorPoint = function (anchorPoint) {
    if (anchorPoint === this.anchorPoint1) {
      return this.circle2;
    } else if (anchorPoint === this.anchorPoint2) {
      return this.circle1;
    }

    console.error('The given anchor point should be one of the points of this anchor line');
  }

  this.getLine = function () {
    var p1 = new Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
    var p2 = new Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));

    return new Line(p1, p2);
  }

  this.setupExtendedPaths = function (widePath, narrowPath, p1, p2) {
    var pathString = 'M' + p1.x + ',' + p1.y;
    pathString += 'L' + p2.x + ',' + p2.y;
    widePath.attr('path', pathString);
    narrowPath.attr('path', pathString);

    widePath.show();
    narrowPath.show();
  }

  this.addAnchorHandlesToSet = function (set) {
    this.anchorPoint1.addAnchorHandlesToSet(set);
    this.anchorPoint2.addAnchorHandlesToSet(set);
  }

  this.addAnchorLinesToSet = function (set) {
    set.push(this.path1wide);
    set.push(this.path1narrow);
    set.push(this.path2wide);
    set.push(this.path2narrow);
    set.push(this.middlePath);
  }

  this.update = function () {
    var p1 = new Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
    var p2 = new Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
    var anchors = this.computeAnchorPositions();
    if (anchors.length !== 0) {
      var deltaP = p2.clone().subtract(p1);
      var deltaAnchor = anchors[1].clone().subtract(anchors[0]);
      if ((deltaP.x * deltaAnchor.x >= 0) && (deltaP.y * deltaAnchor.y >= 0)) {
        this.anchorPoint1.setPosition(anchors[0]);
        this.anchorPoint2.setPosition(anchors[1]);
      } else {
        this.anchorPoint1.setPosition(anchors[1]);
        this.anchorPoint2.setPosition(anchors[0]);
      }

      this.setupExtendedPaths(this.path1wide, this.path1narrow, this.anchorPoint1.position, this.circle1.point);
      this.setupExtendedPaths(this.path2wide, this.path2narrow, this.anchorPoint2.position, this.circle2.point);

      var pathString = 'M' + this.circle1.point.x + ',' + this.circle1.point.y;
      pathString += 'L' + this.circle2.point.x + ',' + this.circle2.point.y;
      this.middlePath.attr('path', pathString);
      this.middlePath.show();
    } else {
      this.path1wide.hide();
      this.path1narrow.hide();
      this.path2wide.hide();
      this.path2narrow.hide();
      this.middlePath.hide();
    }

    this.anchorPoint1.update();
    this.anchorPoint2.update();
  }

  this.initPathStyles = function() {
    this.path1wide.attr('stroke', PerspectiveToolSettings.anchorLine.widePath.stroke);
    this.path1narrow.attr('stroke', PerspectiveToolSettings.anchorLine.narrowPath.stroke);
    this.path2wide.attr('stroke', PerspectiveToolSettings.anchorLine.widePath.stroke);
    this.path2narrow.attr('stroke', PerspectiveToolSettings.anchorLine.narrowPath.stroke);
    this.middlePath.attr('stroke', PerspectiveToolSettings.anchorLine.middlePath.stroke);
    this.path1wide.attr('stroke-width', PerspectiveToolSettings.anchorLine.widePath.strokeWidth);
    this.path1narrow.attr('stroke-width', PerspectiveToolSettings.anchorLine.narrowPath.strokeWidth);
    this.path2wide.attr('stroke-width', PerspectiveToolSettings.anchorLine.widePath.strokeWidth);
    this.path2narrow.attr('stroke-width', PerspectiveToolSettings.anchorLine.narrowPath.strokeWidth);
    this.middlePath.attr('stroke-width', PerspectiveToolSettings.anchorLine.middlePath.strokeWidth);
    this.path1wide.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.widePath.strokeOpacity);
    this.path1narrow.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.narrowPath.strokeOpacity);
    this.path2wide.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.widePath.strokeOpacity);
    this.path2narrow.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.narrowPath.strokeOpacity);
    this.middlePath.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.middlePath.strokeOpacity);
  }

  // just initialize the anchorPoints, they will be positioned correctly in the update right after
  this.anchorPoint1 = new AnchorPoint(new Point2D(0, 0), this.circle1, this);
  this.anchorPoint2 = new AnchorPoint(new Point2D(0, 0), this.circle2, this);

  this.path1wide = this.paper.path('M0,0L0,0');
  this.path1narrow = this.paper.path('M0,0L0,0');
  this.path2wide = this.paper.path('M0,0L0,0');
  this.path2narrow = this.paper.path('M0,0L0,0');
  this.middlePath = this.paper.path('M0,0L0,0');
  this.initPathStyles();

  this.update();
}

function AnchorPoint(point, circle, anchorLine) {
  this.associatedCircle = circle;
  this.position = point;
  this.anchorLine = anchorLine;
  this.perspectiveTool = anchorLine.perspectiveTool;
  this.paper = anchorLine.paper;

  this.handle = this.paper.circle(this.position.x, this.position.y, 10);
  this.handle.attr('fill', PerspectiveToolSettings.anchorLine.handle.fillIdle);
  this.handle.attr('opacity', PerspectiveToolSettings.anchorLine.handle.opacity);
  var initialHandlePos = undefined;
  var dragging = false;
  var hoverIn = function () {
    var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);
    if (movementDirection === 'horizontal') {
      setCursor('ew-resize');
    } else if (movementDirection === 'vertical') {
      setCursor('ns-resize');
    }
    this.handle.attr('fill', PerspectiveToolSettings.anchorLine.handle.fillHoverIn);
  }

  var hoverOut = function () {
    setCursor('auto');
    if (!dragging) {
      this.handle.attr('fill', PerspectiveToolSettings.anchorLine.handle.fillIdle);
    }
  }

  var drag = function (dx, dy, x, y, event) {
    var oppositeCircle = this.anchorLine.getCircleOppositeToAnchorPoint(this);
    var lines = this.anchorLine.anchorSystem.getAnchorLinesForCircle(this.associatedCircle);
    var movementAnchorLine = null;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i] !== this.anchorLine) {
        movementAnchorLine = lines[i];
        break;
      }
    }

    var p1 = initialHandlePos.clone().add(new Point2D(dx, dy));
    var p2 = new Point2D(oppositeCircle.circle.attr('cx'), oppositeCircle.circle.attr('cy'));
    var intersect = new Line(p1, p2).findIntersectWithLine(movementAnchorLine.getLine());

    var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);

    if (movementDirection == 'horizontal') {
      setCursor('ew-resize');
    } else if (movementDirection == 'vertical') {
      setCursor('ns-resize');
    }

    if (this.anchorLine.anchorSystem.isCirclePositionInvalid(this.associatedCircle, intersect.clone())) {
      return;
    }

    this.associatedCircle.point.x = intersect.x;
    this.associatedCircle.point.y = intersect.y;
    this.anchorLine.anchorSystem.update();
    this.perspectiveTool.update();
  };

  var dragStart = function (x, y, event) {
    dragging = true;
    initialHandlePos = new Point2D(this.handle.attr('cx'), this.handle.attr('cy'));

    var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);
    if (movementDirection === 'horizontal') {
      setCursor('ew-resize');
    } else if (movementDirection === 'vertical') {
      setCursor('ns-resize');
    }
  };

  var dragEnds = function (event) {
    this.handle.attr('fill', PerspectiveToolSettings.anchorLine.handle.fillIdle);
    setCursor('auto');
    dragging = false;
  };

  this.handle.hover(hoverIn.bind(this), hoverOut.bind(this));

  this.handle.drag(drag.bind(this), dragStart.bind(this), dragEnds.bind(this));

  this.setPaperInstance = function (paper) {
    this.paper = paper;
  }

  this.setPosition = function (pos) {
    this.position.setTo(pos);
    this.handle.transform('t' + this.position.x + ',' + this.position.y);
  }

  this.addAnchorHandlesToSet = function (set) {
    set.push(this.handle);
  }

  this.update = function () {
    if (!this.anchorLine.anchorSystem.isCloseToRegion(this.anchorLine.circle1.point, -this.anchorLine.circle1.radius)
      && !this.anchorLine.anchorSystem.isCloseToRegion(this.anchorLine.circle2.point, -this.anchorLine.circle2.radius)) {
      this.handle.hide();
    } else {
      this.handle.show();
    }
  }
}
