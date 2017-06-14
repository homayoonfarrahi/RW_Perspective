pa = new Point2D(256, 498);
pb = new Point2D(255, 673);
pc = new Point2D(486, 607);
pd = new Point2D(445, 455);

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
  fillerPath.attr('fill', '#fff');
  fillerPath.attr('opacity', 0.4);
};

var toRadians = function(degree) {
  return degree * (Math.PI / 180);
};

var getCursorStyleForSlope = function(slope) {
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

var paper = Raphael(0, 0, 1120, 840);
var backgroundSet = paper.set();
var nonInteractableSet = paper.set();
var fillerSet = paper.set();
var planeEdgeSet = paper.set();
var planeVertexSet = paper.set();
var anchorHandleSet = paper.set();


var image = paper.image("outdoor.jpg", 0, 0, 1120, 840);
backgroundSet.push(image);

var circles = [];
centers = [pa, pb, pc, pd];
for (var i = 0; i < 4; i++) {
  var radius = 7;
  var circle = paper.circle(centers[i].x, centers[i].y, radius);
  circle.attr('fill', '#00f');
  circle.attr('opacity', 0.5);

  (function (i, circle) {
    var initialCirclePos = undefined;

    var circleDragMove = function(dx, dy, x, y, event) {
      var i = 0;
      for (i = 0; i < circles.length; i++) {
        if (circles[i].circle === circle) break;
      }
      circles[i].point.setTo(initialCirclePos.clone().add(new Point2D(dx, dy)));
      updateCircles();
      updatePathsForCircle(circle);
      updateFillerPath();
      anchorSystem.update();
      grid.update();
    }

    var circleDragStart = function (x, y, event) {
      circle.attr('fill', '#f00');
      document.body.style.cursor = 'move';
      initialCirclePos = new Point2D(circle.attr('cx'), circle.attr('cy'));
    }

    var circleDragEnd = function (event) {
      circle.attr('fill', '#00f');
      document.body.style.cursor = 'default';
    }

    circle.drag(circleDragMove, circleDragStart, circleDragEnd);
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

var paths = [];
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

    var edgeDragStart = function (x, y) {
      otherLine1 = new Line(getCenter(from), getCenter(from + 3));
      otherLine2 = new Line(getCenter(from + 1), getCenter(from + 2));
      vanishingPoint = new Line(getCenter(from), getCenter(from + 1)).findIntersectWithLine(new Line(getCenter(from + 2), getCenter(from + 3)));
      movementPoint = new Line(getCenter(from), getCenter(from + 1)).closestPointTo(new Point2D(x, y));

      // finding the slope of bisector to display the appropriate cursor direction
      var direction1 = getCenter(from + 3).clone().subtract(getCenter(from)).normalize();
      var direction2 = getCenter(from + 2).clone().subtract(getCenter(from + 1)).normalize();
      var angleBisectorDirection = direction1.clone().add(direction2).divideBy(2);
      var angleBisectorLine = new Line(new Point2D(0, 0), angleBisectorDirection.clone());
      document.body.style.cursor = getCursorStyleForSlope(angleBisectorLine.getSlope());
      path.attr('stroke', '#f00');
    }

    var edgeDragMove = function (dx, dy, x, y) {
      var line = new Line(vanishingPoint, new Point2D(movementPoint.x + dx, movementPoint.y + dy));
      var newPoint1 = otherLine1.findIntersectWithLine(line);
      var newPoint2 = otherLine2.findIntersectWithLine(line);
      getCenter(from).setTo(newPoint1);
      getCenter(from + 1).setTo(newPoint2);
      updateCircles();
      updatePaths();
      updateFillerPath();
      anchorSystem.update();
      grid.update();
    }

    var edgeDragEnd = function (event) {
      path.attr('stroke', '#00f');
      document.body.style.cursor = 'default';
    }

    path.drag(edgeDragMove, edgeDragStart, edgeDragEnd);
  })(from, path);

  path.attr('stroke', '#00f');
  path.attr('stroke-width', 7);
  path.attr('stroke-opacity', 0.3);
  path.attr('stroke-linecap', 'round');

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
errorNegativeZ = 'error negative z';

function perspectivePointsAreInvalid(a, b, c, d) {
  return (a == errorNegativeZ || b == errorNegativeZ || c == errorNegativeZ || d == errorNegativeZ) ||
    (Math.abs(a.x - c.x) < 10 || Math.abs(a.y - c.y) < 10);
}

var start = function (x, y) {
  plane = new Plane(centers[0].clone(), centers[1].clone(), centers[2].clone(), centers[3].clone(), 300, 300);
  uv = plane.screenToUV(x, y);
  lastU = uv.x;
  lastV = uv.y;
  document.body.style.cursor = 'move';
}

var end = function () {
  document.body.style.cursor = 'default';
}

var move = function (dx, dy, x, y) {
  uv = plane.screenToUV(x, y);

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
  updateCircles();
  updatePaths();
  updateFillerPath();
  anchorSystem.update();
  grid.update();
}

var pathString = getClosedPathString();
var fillerPath = paper.path(pathString);
fillerPath.attr('fill', '#fff');
fillerPath.attr('stroke', '#fff');
fillerPath.attr('opacity', 0.4);
fillerPath.attr('stroke-opacity', 0.4);
fillerPath.drag(move, start, end);
fillerSet.push(fillerPath);

var anchorSystem = new AnchorSystem([0, 1120, 0, 840]);
anchorSystem.setPaperInstance(paper);
anchorSystem.addAnchorLine(circles[0], circles[1]);
anchorSystem.addAnchorLine(circles[1], circles[2]);
anchorSystem.addAnchorLine(circles[2], circles[3]);
anchorSystem.addAnchorLine(circles[3], circles[0]);

var grid = new Grid(centers[0], centers[1], centers[2], centers[3], 5.5, 3.5, paper);


nonInteractableSet.insertAfter(backgroundSet);
fillerSet.insertAfter(nonInteractableSet);
planeEdgeSet.insertAfter(fillerSet);
planeVertexSet.insertAfter(planeEdgeSet);
anchorHandleSet.insertAfter(planeVertexSet);
