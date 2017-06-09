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

const paper = Raphael(0, 0, 1120, 840);
const background = paper.set();
const foreground = paper.set();
foreground.insertAfter(background);

const image = paper.image("https://images.pond5.com/abstract-checkerboard-blur-end-loopable-footage-010559548_prevstill.jpeg", 0, 0, 1120, 840);
background.push(image);

const circles = [];
centers = [pa, pb, pc, pd];
for (let i = 0; i < 4; i++) {
  const circle = paper.circle(centers[i].x, centers[i].y, 15);
  circle.attr('fill', '#00f');
  circle.attr('opacity', 0.5);
  var initialCirclePos = undefined;
  circle.drag(
    (dx, dy, x, y, event) => {
      var i = 0;
      for (i = 0; i < circles.length; i++) {
        if (circles[i].circle === circle) break;
      }
      circles[i].point.setTo(initialCirclePos.clone().add(new Point2(dx, dy)));
      updateCircles();
      updatePathsForCircle(circle);
      updateFillerPath();
      anchorSystem.update();
    },
    (x, y, event) => {
      circle.attr('fill', '#f00');
      initialCirclePos = new Point2(circle.attr('cx'), circle.attr('cy'));
    },
    (event) => {
      circle.attr('fill', '#00f');
    },
  );
  foreground.push(circle);

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

  const pathString = getPathString(circles[from], circles[to]);
  const path = paper.path(pathString);
  path.attr('stroke', '#00f');
  path.attr('stroke-width', 10);
  path.attr('stroke-opacity', 0.5);
  path.drag(
    (dx, dy, x, y, event) => {
    },
    (x, y, event) => {
      path.attr('stroke', '#f00');
    },
    (event) => {
      path.attr('stroke', '#00f');
    },
  );
  path.toBack();
  foreground.push(path);

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
  plane = new Plane(centers[0], centers[1], centers[2], centers[3], 300, 300);
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

  if (perspectivePointsAreInvalid(tmpPA,tmpPB,tmpPC,tmpPD)) {
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
background.push(fillerPath);

foreground.insertAfter(background);

var anchorSystem = new AnchorSystem([0, 1120, 0, 840]);
anchorSystem.setPaperInstance(paper);
anchorSystem.addAnchorLine(circles[0], circles[1]);
anchorSystem.addAnchorLine(circles[1], circles[2]);
anchorSystem.addAnchorLine(circles[2], circles[3]);
anchorSystem.addAnchorLine(circles[3], circles[0]);
