/**
  This class keeps track of all the other perspectives and a perspective can
  request this class to suggest new positions for a point.

  It checks a point against all other points and lines and checks if a point is near enough
  to be snaped to that position.
*/

Snap = function() {
  this.perspectives = [];

  this.addPlane = function(perspective) {
    this.perspectives.push(perspective);
    perspective.setSnap(this);
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
          var potentialPoint = new Geometry.Line(p1, p2).projectPoint(pos);
        } else {
          var colinearPos = { x: pos.x + direction.x, y: pos.y + direction.y };
          var potentialPoint = Geometry.Line.findIntersect(pos, colinearPos, p1, p2);
        }

        if (Geometry.Line.length2D(pos, potentialPoint) < 20) {
          pos.setTo(potentialPoint);
          return pos;
        }
      }
    }

    return pos;
  }
}
