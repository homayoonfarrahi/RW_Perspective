let pa = new Point2(-200, 600);
let pb = new Point2(-300, 100);
let pc = new Point2(300, 100);
let pd = new Point2(200, 600);
let plane = new Plane(pa, pb, pc, pd);
plane.computeZforProjectedPlane();
console.log(plane)
console.log(plane.projectTo3D(200, 600));
console.log(plane.projectTo3D(-200, 600));
// console.log(plane.getUV(plane.a.x, plane.b.x, plane.c.x, plane.a.y, plane.b.y, plane.c.y, -300, 900));
// console.log(plane.getUV(pa.x, pb.x, pc.x, pa.y, pb.y, pc.y, -300, 900));




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

  for (let i=1 ; i<circles.length ; i++) {
    pathString += 'L' + circles[i].circle.attr('cx') + ',' + circles[i].circle.attr('cy');
  }

  pathString += 'Z';

  return pathString;
}

const updateCircles = function updateCircles() {
  for (let i=0 ; i<4 ; i++) {
    circles[i].circle.attr('cx', centers[i].x + 400);
    circles[i].circle.attr('cy', 700 - centers[i].y);
  }
}

const updatePaths = function updatePaths() {
  for (let i=0 ; i<paths.length ; i++) {
    const pathString = getPathString(paths[i].circle1, paths[i].circle2)
    paths[i].path.attr('path', pathString);
  }
}

const updatePathsForCircle = function updatePathsForCircle(circle) {
  let i = 0;
  for (i=0 ; i<circles.length ; i++) {
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

const paper = Raphael(0, 0, 1120, 700);
const background = paper.set();
const foreground = paper.set();
foreground.insertAfter(background);

const image = paper.image("outdoor.jpg", 0, 0, 1120, 840);
background.push(image);

const circles = [];
centers = [pa, pb, pc, pd];
for (let i=0 ; i<4 ; i++) {
  const circle = paper.circle(centers[i].x + 400, 700 - centers[i].y, 15);
  circle.attr('fill', '#00f');
  circle.attr('opacity', 0.5);
  circle.drag(
    (dx, dy, x, y, event) => {
      circle.attr('cx', x);
      circle.attr('cy', y);
      var i = 0;
      for (i=0 ; i<circles.length ; i++) {
        if (circles[i].circle === circle) break;
      }
      circles[i].point.x = x - 400;
      circles[i].point.y = 700 - y;
      updatePathsForCircle(circle);
      updateFillerPath();
      plane.computeZforProjectedPlane();
    },
    (x, y, event) => {
      circle.attr('fill', '#f00');
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
for (let from=0 ; from<circles.length ; from++) {
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
      const mouse3d = plane.projectTo3D(x-400, 700-y);
      console.log(mouse3d)
    },
    (x, y, event) => {
      path.attr('stroke', '#f00');
    },
    (event) => {
      path.attr('stroke', '#00f');
    },
  );
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

const pathString = getClosedPathString();
const fillerPath = paper.path(pathString);
fillerPath.attr('fill', '#fff');
fillerPath.attr('stroke', '#fff');
fillerPath.attr('opacity', 0.4);
fillerPath.attr('stroke-opacity', 0.4);
fillerPath.drag(
  (dx, dy, x, y, event) => {
    const lastMousePos = new Point2(x - event.movementX, y - event.movementY);
    lastMousePos.x -= 400;
    lastMousePos.y = 700 - lastMousePos.y;
    // const lastMousePos3D = plane.projectTo3D(lastMousePos.x, lastMousePos.y);
    const lastMousePos3D = new Point2(lastMousePos.x, lastMousePos.y);

    // const mousePos3D = plane.projectTo3D(x-400, 700-y);
    const mousePos3D = new Point2(x-400, 700-y);
    const deltaMovement3D = mousePos3D.clone().subtract(lastMousePos3D);

    // const a = plane.a.clone2D().add(deltaMovement3D);
    // getUV a (+400, 700-)
    pa = pa.add(deltaMovement3D);
    // const b = plane.b.clone2D().add(deltaMovement3D);
    // getUV b (+400, 700-)
    pb = pb.add(deltaMovement3D);
    // const c = plane.c.clone2D().add(deltaMovement3D);
    // getUV c (+400, 700-)
    pc = pc.add(deltaMovement3D);
    // const d = plane.d.clone2D().add(deltaMovement3D);
    // getUV d (+400, 700-)
    pd = pd.add(deltaMovement3D);

    updateCircles();
    updatePaths();
    updateFillerPath();

    plane.computeZforProjectedPlane();
  },
  (x, y, event) => {
    fillerPath.attr('stroke', '#f00');
  },
  (event) => {
    fillerPath.attr('stroke', '#00f');
  },
);
background.push(fillerPath);

foreground.insertAfter(background);
