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
      this.camera = new Geometry.Point3D(0.0, 0.0, 0.0);
      this.vanishingVectors = [];

      this.init = function() {
        for (var i = 0; i < vertices.length; i++) {
          this.vertices.push(this.transformPointToNormalizedSpace(vertices[i], this.perspectiveTool.getDivSize()));
        }

        var edges = this.createEdgesFromVertices();

        if (edges[0].isParallelWith(edges[2]) || edges[1].isParallelWith(edges[3])) {
          this.camera.z = this.perspectiveTool.getDivSize().x / 2;
        } else {
          this.vanishingPoints = this.calculateVanishingPoints(edges);
          var vpsLine = new Geometry.Line(this.vanishingPoints[0], this.vanishingPoints[1]);
          var T = vpsLine.projectPoint(new Geometry.Point2D(0.0, 0.0));
          var TCp = Math.sqrt(this.vanishingPoints[0].distanceFromPoint(T) * this.vanishingPoints[1].distanceFromPoint(T));
          var TCi = T.distanceFromPoint(new Geometry.Point2D(0.0, 0.0));
          var focalLength = Math.sqrt((TCp * TCp) - (TCi * TCi));
          this.camera.z = focalLength;
          this.calculateVanishingVectors();
        }
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
        var vp1_3d = new Geometry.Point3D(this.vanishingPoints[0].x, this.vanishingPoints[0].y, 0.0);
        var vp2_3d = new Geometry.Point3D(this.vanishingPoints[1].x, this.vanishingPoints[1].y, 0.0);
        var vv1 = vp1_3d.clone().subtract(this.camera).normalize();
        var vv2 = vp2_3d.clone().subtract(this.camera).normalize();
        var vv3 = vv1.clone().crossProduct(vv2).normalize();
        // if (vv3.z > 0) {
        //   vv3 = vv3.multiplyBy(-1);
        // }

        this.vanishingVectors.push(vv1, vv2, vv3);
        var vp3_3d = vv3.findIntersectWithPlaneZ(-this.camera.z);
        vp3_3d = vp3_3d.add(new Geometry.Point3D(0.0, 0.0, this.camera.z));
        this.vanishingPoints.push(vp3_3d.clone2D());
        // console.log(this.vanishingPoints);
        // console.log(this.vanishingVectors);
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
          console.log(orderedPoints)
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

      this.rotate = function(i) {
        // calculate the position of the half degree vanishing point
        var rotationDirection = this.vanishingVectors[2].clone().crossProduct(this.vanishingVectors[(i + 1) % 2]);
        var halfDegreeVV = this.vanishingVectors[2].clone().rotate(rotationDirection, 135);
        var halfDegreeVP = halfDegreeVV.findIntersectWithPlaneZ(-this.camera.z);
        halfDegreeVP = halfDegreeVP.add(new Geometry.Point3D(0.0, 0.0, this.camera.z));
        halfDegreeVP = halfDegreeVP.clone2D();

        var newEdgeLine = new Geometry.Line(this.vanishingPoints[2], this.vertices[i]);
        var intersectorLine = new Geometry.Line(halfDegreeVP, this.vertices[(i + 3) % 4]);
        var newPoint1 = newEdgeLine.findIntersectWithLine(intersectorLine);

        newEdgeLine = new Geometry.Line(this.vanishingPoints[2], this.vertices[(i + 1) % 4]);
        intersectorLine = new Geometry.Line(halfDegreeVP, this.vertices[(i + 2) % 4]);
        var newPoint2 = newEdgeLine.findIntersectWithLine(intersectorLine);

        var newPositions = [];
        newPositions.push(newPoint2, this.vertices[(i + 1) % 4], this.vertices[i], newPoint1);
        newPositions = this.findCorrectPointOrdering(newPositions);

        for (var j = 0; j < newPositions.length; j++) {
          newPositions[j] = this.transformPointToOriginalSpace(newPositions[j], this.perspectiveTool.getDivSize());
        }

        return newPositions;
      }

      this.init();
    }

    return pTool;
})(pTool || {});
