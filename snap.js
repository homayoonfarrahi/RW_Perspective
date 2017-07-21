Snap = function() {
  this.perspectives = [];

  var findCenterPoint = function(a, b, c, d) {
      //finds the center between FOUR points
      //to find the centerpoint between just TWO points (not four), then enter CenterPoint(a, b, a, b)
      var x1, x2, y1, y2;
      var ab, cd;
      ab = { x: 0, y:0 };
      cd = { x: 0, y:0 };

      //find the center between a and b
      if (a.x > b.x) {
          x1 = b.x;
          x2 = a.x;
      } else
          x1 = a.x;
      x2 = b.x;
      if (a.y > b.y) {
          y1 = b.y;
          y2 = a.y;
      } else
          y1 = a.y;
      y2 = b.y;
      ab.x = x1 + (x2 - x1) / 2;
      ab.y = y1 + (y2 - y1) / 2;

      //find the center between c and d
      if (c.x > d.x) {
          x1 = d.x;
          x2 = c.x;
      } else
          x1 = c.x;
      x2 = d.x;
      if (c.y > d.y) {
          y1 = d.y;
          y2 = c.y;
      } else
          y1 = c.y;
      y2 = d.y;
      cd.x = x1 + (x2 - x1) / 2;
      cd.y = y1 + (y2 - y1) / 2;

      //find the center between ab and cd
      if (ab.x > cd.x) {
          x1 = cd.x;
          x2 = ab.x;
      } else
          x1 = ab.x;
      x2 = cd.x;
      if (ab.y > cd.y) {
          y1 = cd.y;
          y2 = ab.y;
      } else
          y1 = ab.y;
      y2 = cd.y;

      var ret = { x: 0, y:0 };
      ret.x = x1 + (x2 - x1) / 2;
      ret.y = y1 + (y2 - y1) / 2;
      return ret;
  }


  var findIntersect = function(a, b, c, d) {
      //finds intersection between line a-b and line c-d
      var a1 = 0,
          a2 = 0,
          b1 = 0,
          b2 = 0,
          c1 = 0,
          c2 = 0,
          m = 0,
          bb = 0;
      var cp = { x: 0, y:0 };
      var ret = { x: 0, y:0 };

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
          cp = findCenterPoint(a, b, c, d);
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

  var dotProduct = function(va, vb) {
    return va.x * vb.x + va.y * vb.y;
  }

  var length2D = function(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  var projectPointOnLine = function(source, p1, p2) {
    if (p1.x === p2.x && p1.y === p2.y) {
      return { x: p1.x, y: p1.y };
    }

    var vecA = { x: p2.x - p1.x, y: p2.y - p1.y };
    var vecB = { x: source.x - p1.x, y: source.y - p1.y };
    var origin = { x: 0, y: 0 };
    var compB = dotProduct(vecA, vecB) / length2D(origin, vecA);
    var unitA = { x: vecA.x / length2D(origin, vecA), y: vecA.y / length2D(origin, vecA) };
    vecProjB = { x: compB * unitA.x, y: compB * unitA.y };
    projectionPoint = { x: p1.x + vecProjB.x, y: p1.y + vecProjB.y };

    return projectionPoint;
  }

  this.addPlane = function(perspective) {
    this.perspectives.push(perspective);
  }

  this.suggestPosition = function(currentPerspective, pos, direction) {
    for (var i = 0; i < this.perspectives.length; i++) {
      if (currentPerspective === this.perspectives[i]) {
        continue;
      }

      var targetPoints = this.perspectives[i].getPoints();

      // first see if you can snap to a nearby point
      if (direction === null) {
        for (var j = 0; j < targetPoints.length; j++) {
          if (Math.abs(pos.x - targetPoints[j].x) < 20 && Math.abs(pos.y - targetPoints[j].y) < 20) {
            pos.setTo(targetPoints[j]);
            return pos;
          }
        }
      }

      // then see if you can snap to a nearby line
      for (var j = 0; j < targetPoints.length; j++) {
        var p1 = targetPoints[j];
        var p2 = targetPoints[(j + 1) % targetPoints.length];

        if (direction === null) {
          var potentialPoint = projectPointOnLine(pos, p1, p2);
        } else {
          var colinearPos = { x: pos.x + direction.x, y: pos.y + direction.y };
          var potentialPoint = findIntersect(pos, colinearPos, p1, p2);
        }

        if (length2D(pos, potentialPoint) < 20) {
          pos.setTo(potentialPoint);
          return pos;
        }
      }
    }

    return pos;
  }
}
