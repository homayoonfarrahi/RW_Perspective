function Line(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;

  this.getYforX = function(givenX) {
    var dx = this.p2.x - this.p1.x;
    var dy = this.p2.y - this.p1.y;

    if (dy === 0) {
      return this.p1.y;
    }

    if (dx === 0) {
      return undefined;
    }

    var slope = dy / dx;
    var yIntercept = this.p1.y - (slope * this.p1.x);

    return (slope * givenX) + yIntercept;
  }

  this.getXforY = function(givenY) {
    var dx = this.p2.x - this.p1.x;
    var dy = this.p2.y - this.p1.y;

    if (dy === 0) {
      return undefined;
    }

    if (dx === 0) {
      return this.p1.x;
    }

    var slope = dy / dx;
    var yIntercept = this.p1.y - (slope * this.p1.x);

    return (givenY - yIntercept) / slope;
  }

  this.findIntersectWithLine = function(line) {
    return Line.findIntersect(this.p1, this.p2, line.p1, line.p2);
  }

  this.getSegmentPoints = function(partCount) {
    var points = [];
    var segmentDirection = this.p2.clone().subtract(this.p1).divideBy(partCount);
    for (var i = 0 ; i < Math.ceil(partCount) - 1 ; i++) {
      var segmentPoint = this.p1.clone().add(segmentDirection.clone().multiplyBy(i + 1));
      points.push(segmentPoint);
    }

    return points;
  }

  this.closestPointTo = function(givenPoint) {
    var dx = this.p2.x - this.p1.x;
    var dy = this.p2.y - this.p1.y;

    if (dy === 0) {
      return new Point2D(givenPoint.x, p1.y);
    }

    if (dx === 0) {
      return new Point2D(p1.x, givenPoint.y)
    }

    var slope = dy / dx;
    var perpendicularSlope = -1 / slope;
    var perpendicularLine = new Line(givenPoint, givenPoint.clone().add(new Point2D(1, perpendicularSlope)));
    var closestPoint = this.findIntersectWithLine(perpendicularLine);

    return closestPoint;
  }

  this.getSlope = function() {
    var dx = this.p2.x - this.p1.x;
    var dy = this.p2.y - this.p1.y;

    if (dx === 0) {
      return undefined;
    }

    return dy / dx;
  }

  this.getAngle = function() {
    var slope = this.getSlope();
    if (slope === undefined) {
      return 90;
    }

    return Math.atan(slope) * (180.0 / Math.PI);
  }

  this.getPerpendicularDirection = function() {
    var slope = this.getSlope();
    if (slope === undefined) {
      return new Point2D(-1, 0);
    }

    if (slope === 0) {
      return new Point2D(0, 1);
    }

    var perpendicularSlope = -1 / slope;
    
  }

  Line.findIntersect = function(a, b, c, d) {
    //finds intersection between line a-b and line c-d
    var a1 = 0,
    a2 = 0,
    b1 = 0,
    b2 = 0,
    c1 = 0,
    c2 = 0,
    m = 0,
    bb = 0;
    var cp = new Point2D(0, 0);
    var ret = new Point2D(0, 0);

    a1 = a.y - b.y;
    a2 = c.y - d.y;
    b1 = b.x - a.x;
    b2 = d.x - c.x;
    c1 = a1 * a.x + b1 * a.y;
    c2 = a2 * c.x + b2 * c.y;

    if (a2 * b1 == a1 * b2) {
      //the lines are parallel, so no intersect exists
      //instead, create an "infinite" parallel line centerpoint for "vanishing point"
      //a. get center point
      cp = Plane.findCenterPoint(a, b, c, d);
      //b. get slope of a-b line
      if ((b.x - a.x) == 0) {
        //c. vertical line, slope is infinite
        ret.x = cp.x;
        ret.y = 1000000000;
      } else {
        //c. not a vertical line (may be horizontal, though, where slope=0)
        m = (b.y - a.y) / (b.x - a.x);
        bb = cp.y - m * cp.x;
        //d. extend x to 1000000000, find y
        ret.x = 1000000000;
        ret.y = m * ret.x + bb;
      }
      return ret;
    }

    //calculate line intersection points
    ret.x = (c1 * b2 - b1 * c2) / (a1 * b2 - a2 * b1);
    ret.y = (c1 * a2 - a1 * c2) / (a2 * b1 - a1 * b2);
    return ret;
  }

  Line.length2D = function(a, b) {
    //calculates the distance between two points in 2d space
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }
}
