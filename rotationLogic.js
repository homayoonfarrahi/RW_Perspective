/**
  This class is responsible for complex 3D rotation calculations.

  This class and plane.js are analogous. The class in plane.js implements the logic
  for translation in the same plane in 3D space, whereas this class implements the
  logic for rotation of the perspective plane around one of its edges in 3D space.

  A full explanation of the method used here can be seen at:
  https://docs.google.com/document/d/1_0b-IhyPU1G6sGbZMmM2JrWZ3Gv3Xs-DE_eXb_-90dA/edit#
*/

var pTool = (function(pTool) {

  // Cross-File Private State
  var _private = pTool._private = pTool._private || {},
    _seal = pTool._seal = pTool._seal || function() {
        delete pTool._private;
        delete pTool._seal;
        delete pTool._unseal;
    },
    _unseal = pTool._unseal = pTool._unseal || function() {
        pTool._private = _private;
        pTool._seal = _seal;
        pTool._unseal = _unseal;
    };

    _private.RotationLogic = function(vertices, perspectiveTool) {
      this.vertices = [];
      this.perspectiveTool = perspectiveTool;
      this.vanishingPoints = [];
      this.centerOfImage = new Geometry.Point3D(0.0, 0.0, 0.0);
      this.camera = new Geometry.Point3D(0.0, 0.0, 0.0);
      this.vanishingVectors = [];

      // init calculates the correct center of image, position of camera and its
      // focal length
      this.init = function() {
        for (var i = 0; i < vertices.length; i++) {
          this.vertices.push(this.transformPointToNormalizedSpace(vertices[i], this.perspectiveTool.getDivSize()));
        }

        var edges = this.createEdgesFromVertices();
        this.vanishingPoints = this.calculateVanishingPoints(edges);
        var focalLength = 1.0;

        if (this.isPointAtInfinity(this.vanishingPoints[0]) && this.isPointAtInfinity(this.vanishingPoints[1])) {
          this.centerOfImage = new Geometry.Point3D(0.0, 0.0, 0.0);
          focalLength = 2;
        }
        else if (this.isPointAtInfinity(this.vanishingPoints[0]) || this.isPointAtInfinity(this.vanishingPoints[1])) {
          var finiteVPIndex = 0;
          if (this.isPointAtInfinity(this.vanishingPoints[0])) {
            finiteVPIndex = 1;
          }

          var ciPoint2 = edges[1 - finiteVPIndex].projectPoint(this.vanishingPoints[finiteVPIndex]);
          var ciLine = new Geometry.Line(this.vanishingPoints[finiteVPIndex], ciPoint2);
          var ciPoint2D = ciLine.projectPoint(new Geometry.Point2D(0.0, 0.0));
          this.centerOfImage = new Geometry.Point3D(ciPoint2D.x, ciPoint2D.y, 0.0);
          focalLength = 2;
        }
        else {
          // TODO center of image has to be calculated more accurately
          this.centerOfImage = new Geometry.Point3D(0.0, 0.0, 0.0);

          var vpsLine = new Geometry.Line(this.vanishingPoints[0], this.vanishingPoints[1]);
          var T = vpsLine.projectPoint(this.centerOfImage.clone2D());
          var TCp = Math.sqrt(this.vanishingPoints[0].distanceFromPoint(T) * this.vanishingPoints[1].distanceFromPoint(T));
          var TCi = T.distanceFromPoint(this.centerOfImage.clone2D());

          // the abs in the following line should be temporary because center of image is not exact
          focalLength = Math.sqrt(Math.abs((TCp * TCp) - (TCi * TCi)));
        }

        this.camera = this.centerOfImage.clone();
        this.camera = this.camera.add(new Geometry.Point3D(0.0, 0.0, focalLength));

        this.calculateVanishingVectors();
      }

      this.createEdgesFromVertices = function() {
        var edges = [];
        var ab = new Geometry.Line(this.vertices[0], this.vertices[1]);
        var bc = new Geometry.Line(this.vertices[1], this.vertices[2]);
        var cd = new Geometry.Line(this.vertices[2], this.vertices[3]);
        var da = new Geometry.Line(this.vertices[3], this.vertices[0]);
        edges.push(ab, bc, cd, da);

        return edges;
      }

      this.isPointAtInfinity = function(p) {
        if (Math.abs(p.x) > 99999 || Math.abs(p.y) > 99999) {
          return true;
        }

        return false;
      }

      this.transformPointToNormalizedSpace = function(point, imageSize) {
        var x = (2 * point.x / imageSize.x) - 1;
        var y = (2 * (imageSize.y - point.y) / imageSize.y) - 1;
        return new Geometry.Point2D(x, y);
      }

      this.transformPointToOriginalSpace = function(point, imageSize) {
        var x = (point.x + 1) * imageSize.x / 2;
        var y = imageSize.y - ((point.y + 1) * imageSize.y / 2);
        return new Geometry.Point2D(x, y);
      }

      this.calculateVanishingPoints = function(edges) {
        var result = [];
        result.push(edges[0].findIntersectWithLine(edges[2]));
        result.push(edges[1].findIntersectWithLine(edges[3]));

        return result;
      }

      this.calculateVanishingVectors = function() {
        var vv1 = null;
        var vv2 = null;
        var edges = this.createEdgesFromVertices();

        if (this.isPointAtInfinity(this.vanishingPoints[0])) {
          vv1 = new Geometry.Point3D(edges[0].getDirection().x, edges[0].getDirection().y, 0.0);
        } else {
          var vp1_3d = new Geometry.Point3D(this.vanishingPoints[0].x, this.vanishingPoints[0].y, 0.0);
          vv1 = vp1_3d.clone().subtract(this.camera).normalize();
        }

        if (this.isPointAtInfinity(this.vanishingPoints[1])) {
          vv2 = new Geometry.Point3D(edges[1].getDirection().x, edges[1].getDirection().y, 0.0);
        } else {
          var vp2_3d = new Geometry.Point3D(this.vanishingPoints[1].x, this.vanishingPoints[1].y, 0.0);
          vv2 = vp2_3d.clone().subtract(this.camera).normalize();
        }

        var vv3 = vv1.clone().crossProduct(vv2).normalize();

        this.vanishingVectors.push(vv1, vv2, vv3);

        var vp3_3d = vv3.findIntersectWithPlaneZ(-this.camera.z);
        vp3_3d = vp3_3d.add(new Geometry.Point3D(0.0, 0.0, this.camera.z));
        this.vanishingPoints.push(vp3_3d.clone2D());
      }

      this.findCorrectPointOrdering = function(points) {
        var orderedPoints = [];
        var minDistance = Number.MAX_VALUE;
        var firstPointIndex = 0;
        for (var i = 0; i < points.length; i++) {
          if (points[i].getLength() < minDistance) {
            minDistance = points[i].getLength();
            firstPointIndex = i;
          }
        }

        orderedPoints.push(points[firstPointIndex]);
        points.splice(firstPointIndex, 1);
        points.sort(function(p1, p2) {
          var edgeDirection1 = p1.clone().subtract(orderedPoints[0]);
          var edgeDirection2 = p2.clone().subtract(orderedPoints[0]);

          var angle1 = Math.atan2(edgeDirection1.y, edgeDirection1.x);
          if (angle1 > Math.PI / 2 && angle1 <= Math.PI) {
            angle1 -= 2 * Math.PI;
          }

          var angle2 = Math.atan2(edgeDirection2.y, edgeDirection2.x);
          if (angle2 > Math.PI / 2 && angle2 <= Math.PI) {
            angle2 -= 2 * Math.PI;
          }

          return angle1 < angle2;
        });

        for (var i = 0; i < points.length; i++) {
          orderedPoints.push(points[i]);
        }

        return orderedPoints;
      }

      this.isPolygonConcave = function(positions) {
        var crossProductZs = [];
        for (var index = 0; index < positions.length; index++) {
            var prevIndex = (index + positions.length - 1) % positions.length;
            var nextIndex = (index + 1) % positions.length;

            var vec1 = positions[prevIndex].clone().subtract(positions[index]);
            var vec2 = positions[nextIndex].clone().subtract(positions[index]);

            var crossProductZ = (vec1.x * vec2.y) - (vec1.y * vec2.x);
            crossProductZs.push(crossProductZ);
        }

        for (var i = 0; i < crossProductZs.length - 1; i++) {
            if (crossProductZs[i] * crossProductZs[i + 1] < 0) {
                return true;
            }
        }

        return false;
      }

      // rotates the initial plane around one of its edges by angle degrees and
      // returns the potential new positions to be set in the rotationUI file.
      this.rotate = function(edgeIndex, angle) {
        var newPositions = [];
        newPositions[edgeIndex] = this.vertices[edgeIndex];
        newPositions[(edgeIndex + 1) % 4] = this.vertices[(edgeIndex + 1) % 4];

        // calculate the position of the half degree vanishing point
        var rotationDirection = this.vanishingVectors[(edgeIndex + 1) % 2].clone().crossProduct(this.vanishingVectors[2]);

        var newEdgeVV = this.vanishingVectors[(edgeIndex + 1) % 2].clone().rotate(rotationDirection, angle);
        var newEdgeVP = newEdgeVV.findIntersectWithPlaneZ(-this.camera.z);
        newEdgeVP = newEdgeVP.add(this.camera);
        newEdgeVP = newEdgeVP.clone2D();

        var halfDegreeVV = this.vanishingVectors[2].clone().rotate(rotationDirection, angle / 2);
        var halfDegreeVP = halfDegreeVV.findIntersectWithPlaneZ(-this.camera.z);
        halfDegreeVP = halfDegreeVP.add(this.camera);
        halfDegreeVP = halfDegreeVP.clone2D();

        var newEdgeLine = new Geometry.Line(newEdgeVP, this.vertices[edgeIndex]);
        var intersectorLine = new Geometry.Line(halfDegreeVP, this.vertices[(edgeIndex + 3) % 4]);
        var edgeOffset = 1;

        // if the two lines are almost parallel, calculate the other point first
        if (Math.abs(newEdgeLine.getAngle() - intersectorLine.getAngle()) < 0.01) {
          newEdgeLine = new Geometry.Line(newEdgeVP, this.vertices[(edgeIndex + 1) % 4]);
          intersectorLine = new Geometry.Line(halfDegreeVP, this.vertices[(edgeIndex + 2) % 4]);
          edgeOffset = 0;
        }

        var newPoint1 = newEdgeLine.findIntersectWithLine(intersectorLine);
        newPositions[(edgeIndex + 2 + edgeOffset) % 4] = newPoint1;

        newEdgeLine = new Geometry.Line(newEdgeVP, this.vertices[(edgeIndex + edgeOffset) % 4]);
        intersectorLine = new Geometry.Line(this.vanishingPoints[edgeIndex % 2], newPoint1);
        var newPoint2 = newEdgeLine.findIntersectWithLine(intersectorLine);
        newPositions[(edgeIndex + 2 + (1 - edgeOffset)) % 4] = newPoint2;

        if (this.isPolygonConcave(newPositions)) {
          return null;
        }

        for (var j = 0; j < newPositions.length; j++) {
          newPositions[j] = this.transformPointToOriginalSpace(newPositions[j], this.perspectiveTool.getDivSize());
        }

        return newPositions;
      }

      this.init();
    }

    return pTool;
})(pTool || {});
