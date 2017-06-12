pa = new Point2D(256, 498);
pb = new Point2D(255, 673);
pc = new Point2D(486, 607);
pd = new Point2D(445, 455);

const getPathString = function getPathString(circle1, circle2) {
  const startX = circle1.circle.attr('cx');
  const startY = circle1.circle.attr('cy');
  const endX = circle2.circle.attr('cx');
  const endY = circle2.circle.attr('cy');
  const pathString = 'M' + startX + ',' + startY + 'L' + endX + ',' + endY;

  return pathString;
}

const getClosedPathString = function getClosedPathString() {
  let pathString = 'M' + circles[0].circle.attr('cx') + ',' + circles[0].circle.attr('cy');

  for (let i = 1; i < circles.length; i++) {
    pathString += 'L' + circles[i].circle.attr('cx') + ',' + circles[i].circle.attr('cy');
  }

  pathString += 'Z';

  return pathString;
}

const updateCircles = function updateCircles() {
  for (let i = 0; i < circles.length; i++) {
    circles[i].circle.attr('cx', centers[i].x);
    circles[i].circle.attr('cy', centers[i].y);
  }
}

const updatePaths = function updatePaths() {
  for (let i = 0; i < paths.length; i++) {
    const pathString = getPathString(paths[i].circle1, paths[i].circle2)
    paths[i].path.attr('path', pathString);
  }
}

const updatePathsForCircle = function updatePathsForCircle(circle) {
  let i = 0;
  for (i = 0; i < circles.length; i++) {
    if (circles[i].circle === circle) break;
  }

  const path1 = circles[i].path1;
  path1.path.attr('path', getPathString(path1.circle1, path1.circle2));

  const path2 = circles[i].path2;
  path2.path.attr('path', getPathString(path2.circle1, path2.circle2));
};

const updateFillerPath = function updateFillerPath() {
  const pathString = getClosedPathString();
  fillerPath.attr('path', pathString);
  fillerPath.attr('fill', '#fff');
  fillerPath.attr('opacity', 0.4);
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

const circles = [];
centers = [pa, pb, pc, pd];
for (let i = 0; i < 4; i++) {
  const circle = paper.circle(centers[i].x, centers[i].y, 7);
  circle.attr('fill', '#00f');
  circle.attr('opacity', 0.5);
  var initialCirclePos = undefined;
  circle.drag(
    (dx, dy, x, y, event) => {
      var i = 0;
      for (i = 0; i < circles.length; i++) {
        if (circles[i].circle === circle) break;
      }
      circles[i].point.setTo(initialCirclePos.clone().add(new Point2D(dx, dy)));
      updateCircles();
      updatePathsForCircle(circle);
      updateFillerPath();
      anchorSystem.update();
    },
    (x, y, event) => {
      circle.attr('fill', '#f00');
      initialCirclePos = new Point2D(circle.attr('cx'), circle.attr('cy'));
    },
    (event) => {
      circle.attr('fill', '#00f');
    },
  );
  planeVertexSet.push(circle);

  circles.push({
    circle: circle,
    point: centers[i],
    path1: undefined,
    path2: undefined,
  });
}

const paths = [];
for (let from = 0; from < circles.length; from++) {
  let to = from + 1;
  if (to >= circles.length) {
    to = 0;
  }
  function getCenter(i) {
    return centers[i % 4];
  }
  const pathString = getPathString(circles[from], circles[to]);
  const path = paper.path(pathString);

  (function (from) {
    var vanishingPoint;
    var otherLine1;
    var otherLine2;

    var edgeDragStart = function (x, y) {
      otherLine1 = new Line(getCenter(from), getCenter(from + 3));
      otherLine2 = new Line(getCenter(from + 1), getCenter(from + 2));
      vanishingPoint = new Line(getCenter(from), getCenter(from + 1)).findIntersectWithLine(new Line(getCenter(from + 2), getCenter(from + 3)));
      path.attr('stroke', '#f00');
    }

    var edgeDragMove = function (dx, dy, x, y) {
      var line = new Line(vanishingPoint, new Point2D(x, y));
      var newPoint1 = otherLine1.findIntersectWithLine(line);
      var newPoint2 = otherLine2.findIntersectWithLine(line);
      getCenter(from).setTo(newPoint1);
      getCenter(from + 1).setTo(newPoint2);
      updateCircles();
      updatePaths();
      updateFillerPath();
      anchorSystem.update();
    }
    path.drag(edgeDragMove, edgeDragStart, (event) => {
      path.attr('stroke', '#00f');
    });
  })(from);

  path.attr('stroke', '#00f');
  path.attr('stroke-width', 7);
  path.attr('stroke-opacity', 0.3);
  path.attr('stroke-linecap', 'round');

  planeEdgeSet.push(path);

  const pathObj = {
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
}

const pathString = getClosedPathString();
const fillerPath = paper.path(pathString);
fillerPath.attr('fill', '#fff');
fillerPath.attr('stroke', '#fff');
fillerPath.attr('opacity', 0.4);
fillerPath.attr('stroke-opacity', 0.4);
fillerPath.drag(move, start);
fillerSet.push(fillerPath);

var anchorSystem = new AnchorSystem([0, 1120, 0, 840]);
anchorSystem.setPaperInstance(paper);
anchorSystem.addAnchorLine(circles[0], circles[1]);
anchorSystem.addAnchorLine(circles[1], circles[2]);
anchorSystem.addAnchorLine(circles[2], circles[3]);
anchorSystem.addAnchorLine(circles[3], circles[0]);


nonInteractableSet.insertAfter(backgroundSet);
fillerSet.insertAfter(nonInteractableSet);
planeEdgeSet.insertAfter(fillerSet);
planeVertexSet.insertAfter(planeEdgeSet);
anchorHandleSet.insertAfter(planeVertexSet);
