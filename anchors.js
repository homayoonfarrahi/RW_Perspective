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

  this.isCloseToRegion = function(p, maxDistance) {
    if (p.x >= this.minX - maxDistance && p.x <= this.maxX + maxDistance
        && p.y >= this.minY - maxDistance && p.y <= this.maxY + maxDistance) {
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

  this.getMovementDirection = function(anchorPoint) {
    if (anchorPoint.position.x === this.minX || anchorPoint.position.x === this.maxX) {
      return 'vertical';
    } else if (anchorPoint.position.y === this.minY || anchorPoint.position.y === this.maxY) {
      return 'horizontal';
    }
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
  this.path1wide = null;
  this.path1narrow = null;
  this.path2wide = null;
  this.path2narrow = null;
  this.middlePath = null;
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

    // remove duplicate anchor points
    if (anchors.length !== 2 && anchors.length !== 0) {
      for (var i = 0 ; i < anchors.length ; i++) {
        for (var j = i + 1 ; j < anchors.length ; j++) {
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

  this.setupExtendedPaths = function(widePath, narrowPath, p1, p2) {
    var pathString = 'M' + p1.x + ',' + p1.y;
    pathString += 'L' + p2.x + ',' + p2.y;
    widePath.attr('path', pathString);
    narrowPath.attr('path', pathString);

    widePath.attr('stroke', '#000');
    narrowPath.attr('stroke', '#fff');
    widePath.attr('stroke-width', 3);
    narrowPath.attr('stroke-width', 1);
    widePath.attr('stroke-opacity', 0.5);
    narrowPath.attr('stroke-opacity', 0.7);

    widePath.show();
    narrowPath.show();
  }

  this.update = function() {
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

  // just initialize the anchorPoints, they will be positioned correctly in the update right after
  this.anchorPoint1 = new AnchorPoint(new Point2D(0, 0), this.circle1, this);
  this.anchorPoint2 = new AnchorPoint(new Point2D(0, 0), this.circle2, this);
  this.anchorPoint1.setPaperInstance(this.paper);
  this.anchorPoint2.setPaperInstance(this.paper);

  this.path1wide = paper.path('M0,0L0,0');
  this.path1narrow = paper.path('M0,0L0,0');
  this.path2wide = paper.path('M0,0L0,0');
  this.path2narrow = paper.path('M0,0L0,0');
  this.middlePath = paper.path('M0,0L0,0');
  nonInteractableSet.push(this.path1wide);
  nonInteractableSet.push(this.path1narrow);
  nonInteractableSet.push(this.path2wide);
  nonInteractableSet.push(this.path2narrow);
  nonInteractableSet.push(this.middlePath);

  this.update();
}

function AnchorPoint(point, circle, anchorLine) {
  this.associatedCircle = circle;
  this.position = point;
  this.anchorLine = anchorLine;

  this.handle = paper.circle(this.position.x, this.position.y, 10);

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

      var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);
      if (movementDirection === 'horizontal') {
        document.body.style.cursor = 'ew-resize';
      } else if (movementDirection === 'vertical') {
        document.body.style.cursor = 'ns-resize';
      }

      this.associatedCircle.point.x = intersect.x;
      this.associatedCircle.point.y = intersect.y;
      this.anchorLine.anchorSystem.update();
      updatePaths();
      updateFillerPath();
      grid.update();
    }.bind(this),
    function (x, y, event) {
      this.handle.attr('fill', '#f00');
      initialHandlePos = new Point2D(this.handle.attr('cx'), this.handle.attr('cy'));

      var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);
      if (movementDirection === 'horizontal') {
        document.body.style.cursor = 'ew-resize';
      } else if (movementDirection === 'vertical') {
        document.body.style.cursor = 'ns-resize';
      }
    }.bind(this),
    function (event) {
      this.handle.attr('fill', '#00f');
      document.body.style.cursor = 'default';
    }.bind(this)
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

  this.update = function() {
    if (!this.anchorLine.anchorSystem.isCloseToRegion(this.anchorLine.circle1.point, -this.anchorLine.circle1.radius)
        && !this.anchorLine.anchorSystem.isCloseToRegion(this.anchorLine.circle2.point, -this.anchorLine.circle2.radius)) {
      this.handle.hide();
    } else {
      this.handle.show();
    }
  }
}
