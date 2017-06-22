function PerspectiveTool() {
  var pa = new Point2D(256, 498);
  var pb = new Point2D(255, 673);
  var pc = new Point2D(486, 607);
  var pd = new Point2D(445, 455);

  var paper;
  var circles = [];
  var paths = [];
  var fillerPath;
  var backgroundSet;
  var nonInteractableSet;
  var fillerSet;
  var planeEdgeSet;
  var planeVertexSet;
  var anchorHandleSet;

  var anchorSystem;
  var grid;

  var divOffsetX = document.getElementById('perspectiveTool').offsetLeft;
  var divOffsetY = document.getElementById('perspectiveTool').offsetTop;
  var divOffset = new Point2D(divOffsetX, divOffsetY);

  var divSizeX = document.getElementById('perspectiveTool').offsetWidth;
  var divSizeY = document.getElementById('perspectiveTool').offsetHeight;
  var divSize = new Point2D(divSizeX, divSizeY);

  var screenSpaceMovement = false;
  document.onkeydown = function(e) {
    if (e.key === 'Control') {
      screenSpaceMovement = true;
    }
  }
  document.onkeyup = function(e) {
    if (e.key === 'Control') {
      screenSpaceMovement = false;
    }
  }

  var getPathString = function getPathString(circle1, circle2) {
    var startX = circle1.circle.attr('cx');
    var startY = circle1.circle.attr('cy');
    var endX = circle2.circle.attr('cx');
    var endY = circle2.circle.attr('cy');
    var pathString = 'M' + startX + ',' + startY + 'L' + endX + ',' + endY;

    return pathString;
  }

  var getClosedPathString = function getClosedPathString() {
    var pathString = 'M' + circles[0].circle.attr('cx') + ',' + circles[0].circle.attr('cy');

    for (var i = 1; i < circles.length; i++) {
      pathString += 'L' + circles[i].circle.attr('cx') + ',' + circles[i].circle.attr('cy');
    }

    pathString += 'Z';

    return pathString;
  }

  var updateCircles = function updateCircles() {
    for (var i = 0; i < circles.length; i++) {
      circles[i].circle.attr('cx', centers[i].x);
      circles[i].circle.attr('cy', centers[i].y);
    }
  }

  var updatePaths = function updatePaths() {
    for (var i = 0; i < paths.length; i++) {
      var pathString = getPathString(paths[i].circle1, paths[i].circle2)
      paths[i].path.attr('path', pathString);
    }
  }

  var updatePathsForCircle = function updatePathsForCircle(circle) {
    var i = 0;
    for (i = 0; i < circles.length; i++) {
      if (circles[i].circle === circle) break;
    }

    var path1 = circles[i].path1;
    path1.path.attr('path', getPathString(path1.circle1, path1.circle2));

    var path2 = circles[i].path2;
    path2.path.attr('path', getPathString(path2.circle1, path2.circle2));
  };

  var updateFillerPath = function updateFillerPath() {
    var pathString = getClosedPathString();
    fillerPath.attr('path', pathString);
    fillerPath.attr('fill', PerspectiveToolSettings.fillerPath.fill);
    fillerPath.attr('opacity', PerspectiveToolSettings.fillerPath.opacity);
  };

  var toRadians = function (degree) {
    return degree * (Math.PI / 180);
  };

  var getCursorStyleForSlope = function (slope) {
    if (slope === undefined) {
      return 'ns-resize';
    }

    var slopeRadian = Math.atan(slope);
    if (slopeRadian >= toRadians(-90) && slopeRadian < toRadians(-67.5)
      || slopeRadian >= toRadians(67.5) && slopeRadian <= toRadians(90)) {
      return 'ns-resize';
    } else if (slopeRadian >= toRadians(-67.5) && slopeRadian < toRadians(-22.5)) {
      return 'nesw-resize';
    } else if (slopeRadian >= toRadians(-22.5) && slopeRadian < toRadians(22.5)) {
      return 'ew-resize';
    } else if (slopeRadian >= toRadians(22.5) && slopeRadian < toRadians(67.5)) {
      return 'nwse-resize';
    }
  };

  function isPolygonConcave(positions) {
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

  function perspectivePointsAreInvalid(a, b, c, d) {
    errorNegativeZ = 'error negative z';
    return (a == errorNegativeZ || b == errorNegativeZ || c == errorNegativeZ || d == errorNegativeZ) ||
      (Math.abs(a.x - c.x) < 5 || Math.abs(a.y - c.y) < 5);
  }

  this.setDimensions = function (wf, hf) {
    this.widthFeet = wf;
    this.heightFeet = hf;
    grid.setDimensions(wf, hf);
  }

  this.init = function (widthFeet, heightFeet) {
    this.widthFeet = widthFeet;
    this.heightFeet = heightFeet;

    paper = Raphael(document.getElementById('perspectiveTool'), divSize.x, divSize.y);
    backgroundSet = paper.set();
    nonInteractableSet = paper.set();
    fillerSet = paper.set();
    planeEdgeSet = paper.set();
    planeVertexSet = paper.set();
    anchorHandleSet = paper.set();


    // var image = paper.image("outdoor.jpg", 0, 0, divSize.x, divSize.y);
    // backgroundSet.push(image);

    centers = [pa, pb, pc, pd];
    for (var i = 0; i < 4; i++) {
      var radius = 7;
      var circle = paper.circle(centers[i].x, centers[i].y, radius);
      circle.attr('fill', PerspectiveToolSettings.planeVertex.fillIdle);
      circle.attr('opacity', PerspectiveToolSettings.planeVertex.opacity);

      (function (i, circle) {
        var initialCirclePos = undefined;

        var circleDragMove = function (dx, dy, x, y, event) {
          var i = 0;
          for (i = 0; i < circles.length; i++) {
            if (circles[i].circle === circle) break;
          }

          var newPos = initialCirclePos.clone().add(new Point2D(dx, dy));
          var tmpPositions = [pa, pb, pc, pd];
          tmpPositions[i] = newPos;
          if (isPolygonConcave(tmpPositions)) {
            return;
          }

          circles[i].point.setTo(newPos);
          updateCircles();
          updatePathsForCircle(circle);
          updateFillerPath();
          anchorSystem.update();
          grid.update();
        }

        var circleDragStart = function (x, y, event) {
          initialCirclePos = new Point2D(circle.attr('cx'), circle.attr('cy'));
        }

        var circleDragEnd = function (event) {

        }

        var circleHoverIn = function () {
          circle.attr('fill', PerspectiveToolSettings.planeVertex.fillHoverIn);
          setCursor('move');
        }

        var circleHoverOut = function () {
          circle.attr('fill', PerspectiveToolSettings.planeVertex.fillIdle);
          setCursor('default');
        }

        circle.drag(circleDragMove, circleDragStart, circleDragEnd);
        circle.hover(circleHoverIn, circleHoverOut);
      })(i, circle);
      planeVertexSet.push(circle);

      circles.push({
        circle: circle,
        point: centers[i],
        radius: radius,
        path1: undefined,
        path2: undefined,
      });
    }

    for (var from = 0; from < circles.length; from++) {
      var to = from + 1;
      if (to >= circles.length) {
        to = 0;
      }
      function getCenter(i) {
        return centers[i % 4];
      }
      var pathString = getPathString(circles[from], circles[to]);
      var path = paper.path(pathString);

      (function (from, path) {
        var vanishingPoint;
        var otherLine1;
        var otherLine2;
        var movementPoint;
        var dragging = false;
        var edgeDragStart = function (x, y) {
          dragging = true;
          otherLine1 = new Line(getCenter(from), getCenter(from + 3));
          otherLine2 = new Line(getCenter(from + 1), getCenter(from + 2));
          vanishingPoint = new Line(getCenter(from), getCenter(from + 1)).findIntersectWithLine(new Line(getCenter(from + 2), getCenter(from + 3)));
          movementPoint = new Line(getCenter(from), getCenter(from + 1)).closestPointTo(new Point2D(x - divOffset.x, y - divOffset.y));
        }

        var edgeDragMove = function (dx, dy, x, y) {
          var line = new Line(vanishingPoint, new Point2D(movementPoint.x + dx, movementPoint.y + dy));
          var newPoint1 = otherLine1.findIntersectWithLine(line);
          var newPoint2 = otherLine2.findIntersectWithLine(line);

          var tmpPositions = [pa, pb, pc, pd];
          tmpPositions[from] = newPoint1;
          tmpPositions[(from + 1) % tmpPositions.length] = newPoint2;
          if (isPolygonConcave(tmpPositions)) {
            return;
          }

          getCenter(from).setTo(newPoint1);
          getCenter(from + 1).setTo(newPoint2);
          updateCircles();
          updatePaths();
          updateFillerPath();
          anchorSystem.update();
          grid.update();
        }

        var edgeDragEnd = function (event) {
          dragging = false;
          path.attr('stroke', PerspectiveToolSettings.planeEdge.stroke);
        }

        var edgeHoverIn = function () {
          // finding the slope of bisector to display the appropriate cursor direction
          var direction1 = getCenter(from + 3).clone().subtract(getCenter(from)).normalize();
          var direction2 = getCenter(from + 2).clone().subtract(getCenter(from + 1)).normalize();
          var angleBisectorDirection = direction1.clone().add(direction2).divideBy(2);
          var angleBisectorLine = new Line(new Point2D(0, 0), angleBisectorDirection.clone());
          setCursor(getCursorStyleForSlope(angleBisectorLine.getSlope()));
          path.attr('stroke', PerspectiveToolSettings.planeEdge.strokeHoverIn);
        }

        var edgeHoverOut = function () {
          setCursor('auto');
          if (!dragging) {
            path.attr('stroke', PerspectiveToolSettings.planeEdge.stroke);
          }
        }

        path.hover(edgeHoverIn, edgeHoverOut);
        path.drag(edgeDragMove, edgeDragStart, edgeDragEnd);
      })(from, path);

      path.attr('stroke', PerspectiveToolSettings.planeEdge.stroke);
      path.attr('stroke-width', PerspectiveToolSettings.planeEdge.strokeWidth);
      path.attr('stroke-opacity', PerspectiveToolSettings.planeEdge.strokeOpacity);
      path.attr('stroke-linecap', PerspectiveToolSettings.planeEdge.strokeLinecap);

      planeEdgeSet.push(path);

      var pathObj = {
        path: path,
        circle1: circles[from],
        circle2: circles[to],
      };

      circles[from].path1 = pathObj;
      circles[to].path2 = pathObj;

      paths.push(pathObj);
    }

    var lastMousePos;
    var start = function (x, y) {
      plane = new Plane(centers[0].clone(), centers[1].clone(), centers[2].clone(), centers[3].clone(), 300, 300);
      uv = plane.screenToUV(x - divOffset.x, y - divOffset.y);
      lastU = uv.x;
      lastV = uv.y;
      lastMousePos = new Point2D(x, y);
    }

    var end = function () {

    }

    var move = function (dx, dy, x, y) {
      if (!screenSpaceMovement) {
        uv = plane.screenToUV(x - divOffset.x, y - divOffset.y);

        var offsetU = uv.x - lastU;
        var offsetV = uv.y - lastV;
        // Convert back to screen space
        var tmpPA = plane.uvToScreen(offsetU, offsetV);
        var tmpPB = plane.uvToScreen(offsetU, offsetV + plane.uvHeight);
        var tmpPC = plane.uvToScreen(offsetU + plane.uvWidth, offsetV + plane.uvHeight);
        var tmpPD = plane.uvToScreen(offsetU + plane.uvWidth, offsetV);

        if (perspectivePointsAreInvalid(tmpPA, tmpPB, tmpPC, tmpPD)) {
          return;
        }

        centers[0].setTo(tmpPA);
        centers[1].setTo(tmpPB);
        centers[2].setTo(tmpPC);
        centers[3].setTo(tmpPD);
      } else {
        var screenMovement = new Point2D(x - lastMousePos.x, y - lastMousePos.y);
        centers[0].add(screenMovement);
        centers[1].add(screenMovement);
        centers[2].add(screenMovement);
        centers[3].add(screenMovement);
        plane = new Plane(centers[0].clone(), centers[1].clone(), centers[2].clone(), centers[3].clone(), 300, 300);
      }

      updateCircles();
      updatePaths();
      updateFillerPath();
      anchorSystem.update();
      grid.update();
      lastMousePos.setTo(new Point2D(x, y));
    }

    var hoverIn = function () {
      setCursor('move');
    }


    var hoverOut = function () {
      setCursor('default');
    }

    var pathString = getClosedPathString();
    fillerPath = paper.path(pathString);
    fillerPath.attr('fill', PerspectiveToolSettings.fillerPath.fill);
    fillerPath.attr('stroke', PerspectiveToolSettings.fillerPath.stroke);
    fillerPath.attr('opacity', PerspectiveToolSettings.fillerPath.opacity);
    fillerPath.attr('stroke-opacity', PerspectiveToolSettings.fillerPath.strokeOpacity);
    fillerPath.drag(move, start, end);
    fillerPath.hover(hoverIn, hoverOut);
    fillerSet.push(fillerPath);

    anchorSystem = new AnchorSystem([0, divSize.x, 0, divSize.y], circles, this, paper);
    anchorSystem.addAnchorHandlesToSet(anchorHandleSet);
    anchorSystem.addAnchorLinesToSet(nonInteractableSet);

    grid = new Grid(centers[0], centers[1], centers[2], centers[3], this.widthFeet, this.heightFeet, paper);


    // nonInteractableSet.insertAfter(backgroundSet);
    fillerSet.insertAfter(nonInteractableSet);
    planeEdgeSet.insertAfter(fillerSet);
    planeVertexSet.insertAfter(planeEdgeSet);
    anchorHandleSet.insertAfter(planeVertexSet);
  }

  this.getPoints = function() {
    return [pa.clone(), pb.clone(), pc.clone(), pd.clone()];
  }

  this.update = function () {
    updateCircles();
    updatePaths();
    updateFillerPath();
    anchorSystem.update();
    grid.update();
  }
}
