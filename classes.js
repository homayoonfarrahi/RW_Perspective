function Point2(x, y) {
  this.x = x;
  this.y = y;

  this.clone = function() {
    return new Point2(this.x, this.y);
  }

  this.clone2D = function() {
    return new Point2(this.x, this.y);
  }

  this.add = function(p) {
    this.x += p.x;
    this.y += p.y;

    return this;
  }

  this.subtract = function(p) {
    this.x -= p.x;
    this.y -= p.y;

    return this;
  }

  this.distanceFromPoint = function(p) {
    return Math.sqrt((this.x - p.x) * (this.x - p.x) + (this.y - p.y) * (this.y - p.y));
  }

  this.setTo = function(p) {
    this.x = p.x;
    this.y = p.y;
  }
}

function Point3(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;

  this.clone2D = function() {
    return new Point2(this.x, this.y);
  }
}

function Line(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;

  this.getYforX = function(givenX) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;

    if (dy === 0) {
      return p1.y;
    }

    if (dx === 0) {
      return undefined;
    }

    var slope = dy / dx;
    var yIntercept = p1.y - (slope * p1.x);

    return (slope * givenX) + yIntercept;
  }

  this.getXforY = function(givenY) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;

    if (dy === 0) {
      return undefined;
    }

    if (dx === 0) {
      return p1.x;
    }

    var slope = dy / dx;
    var yIntercept = p1.y - (slope * p1.x);

    return (givenY - yIntercept) / slope;
  }

  this.findIntersectWithLine = function(line) {
    return findIntersect(this.p1, this.p2, line.p1, line.p2);
  }
}

class Plane {
  constructor(screenPointA, screenPointB, screenPointC, screenPointD, uvWidth, uvHeight) {

    this.uvWidth = uvWidth;
    this.uvHeight = uvHeight;

    this.vh = null;
    // Horizontal vanishing point
    this.vv = null;
    // Vertical vanishing point
    this.cp = null;
    // Central vanishing point
    this.pa = pa;
    // 2D location of perspective point
    this.pb = pb;
    // 2D location of perspective point
    this.pc = pc;
    // 2D location of perspective point
    this.pd = pd;
    // 2D location of perspective point
    this.a = new Point3(0, 0, 0);
    // 3D location of perspective point
    this.b = new Point3(0, 0, 0);
    // 3D location of perspective point
    this.c = new Point3(0, 0, 0);
    // 3D location of perspective point
    this.d = new Point3(0, 0, 0);
    // 3D location of perspective point
    this.tr_ac = null;
    // 2D transverse intersection point with vh-vv horizon line
    this.tr_bd = null;
    // 2D transverse intersection point with vh-vv horizon line
    this.computeZforProjectedPlane();
  }

  computeZforProjectedPlane() {
    var zDepth = 10;
    //computes the z value for a projected plane
    //z increases into the screen, z decreases out of the screen
    //zDepth sets the z value for the point closest to the screen, and everything else is relative to that point

    var avh = 0,
      bvh = 0,
      cvh = 0,
      dvh = 0;
    var avv = 0,
      bvv = 0,
      cvv = 0,
      dvv = 0;
    var az = 0,
      bz = 0,
      cz = 0,
      dz = 0,
      n = 0;

    //        vv
    //       /  \
    // 2D projected points      3D real-space points
    //    pa ---- pd                 a ------ d
    //     /  cp  \    -> vh         |        |
    //    /        \                 |        |
    //  pb -------- pc               b ------ c

    //1a. Compute vanishing points
    this.vh = findIntersect(this.pa, this.pd, this.pb, this.pc);
    //horizontal vanishing point of projected plane
    this.vv = findIntersect(this.pa, this.pb, this.pc, this.pd);
    //vertical vanishing point of projected plane
    this.cp = findIntersect(this.pa, this.pc, this.pb, this.pd);
    //center point of projected plane

    //1b. Compute transverse points (these are the lines that go through a-c & b-d (criss-cross), and intersect the horizon line of .vh-.vv)
    this.tr_ac = findIntersect(this.pa, this.pc, this.vh, this.vv);
    this.tr_bd = findIntersect(this.pb, this.pd, this.vh, this.vv);

    //2. Get length to vanishing points
    avh = length2D(this.pa, this.vh);
    avv = length2D(this.pa, this.vv);
    bvh = length2D(this.pb, this.vh);
    bvv = length2D(this.pb, this.vv);
    cvh = length2D(this.pc, this.vh);
    cvv = length2D(this.pc, this.vv);
    dvh = length2D(this.pd, this.vh);
    dvv = length2D(this.pd, this.vv);

    if (avh > 9900000)
      avh = 9999999;
    if (avv > 9900000)
      avv = 9999999;
    if (bvh > 9900000)
      bvh = 9999999;
    if (bvv > 9900000)
      bvv = 9999999;
    if (cvh > 9900000)
      cvh = 9999999;
    if (cvv > 9900000)
      cvv = 9999999;
    if (dvh > 9900000)
      dvh = 9999999;
    if (dvv > 9900000)
      dvv = 9999999;

    //3. Compute 1/z for each point, where 1/z at the vanishing point is 0 (in reality, it's infinity, but we'll invert these at the end)
    //determine depth
    az = 1;
    //set a.z arbitrarily to 1 (afterwards we'll invert and then multiply to get to correct zDepth)
    bz = az * bvv / avv;
    //a to b to vv
    dz = az * dvh / avh;
    //a to d to vh
    cz = bz * cvh / bvh;
    //b to c to vh (this could also be d to c to vv; cz = dz * cvv / dvv -- same result)

    //4. Find closest point to screen
    //the largest z value represents the point nearest to the screen (this will get inverted at the end)
    n = az;
    if (bz > n)
      n = bz;
    if (cz > n)
      n = cz;
    if (dz > n)
      n = dz;

    //5. Reset largest Z value to 1 (so that point is closest to the screen and will become zDepth)
    if (az == n) {}
    //a.z is closest to the screen, nothing further to be done

    if (bz == n) {
      //b.z is closest to the screen
      bz = 1;
      //set to 1
      az = bz * avv / bvv;
      //a to b to vv
      dz = az * dvh / avh;
      //a to d to vh
      cz = bz * cvh / bvh;
      //b to c to vh
    }
    if (cz == n) {
      //c.z is closest to the screen
      cz = 1;
      //set to 1
      bz = cz * bvh / cvh;
      //b to c to vh
      az = bz * avv / bvv;
      //a to b to vv
      dz = az * dvh / avh;
      //a to d to vh
    }
    if (dz == n) {
      //d.z is closest to the screen
      dz = 1;
      //set to 1
      cz = dz * cvv / dvv;
      //d to c to vv
      az = dz * avh / dvh;
      //a to d to vh
      bz = cz * bvh / cvh;
      //b to c to vh
    }

    //6. Convert projected 2D points to real-space 3D points  --  pa.x = a.x / z :  pa.y = a.y / z :  z = z
    //invert to make z = infinity at the vanishing point (the z closest to the screen will be the smallest, and equal to zDepth)
    this.a.z = 1 / az * zDepth;
    this.a.x = this.a.z * this.pa.x;
    this.a.y = this.a.z * this.pa.y;

    this.b.z = 1 / bz * zDepth;
    this.b.x = this.b.z * this.pb.x;
    this.b.y = this.b.z * this.pb.y;

    this.c.z = 1 / cz * zDepth;
    this.c.x = this.c.z * this.pc.x;
    this.c.y = this.c.z * this.pc.y;

    this.d.z = 1 / dz * zDepth;
    this.d.x = this.d.z * this.pd.x;
    this.d.y = this.d.z * this.pd.y;

    return this;
  };
  static findCenterPoint(a, b, c, d) {
    //finds the center between FOUR points
    //to find the centerpoint between just TWO points (not four), then enter CenterPoint(a, b, a, b)
    var x1, x2, y1, y2;
    var ab, cd;
    ab = new Point2(0, 0);
    cd = new Point2(0, 0);

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

    var ret = new Point2(0, 0);
    ret.x = x1 + (x2 - x1) / 2;
    ret.y = y1 + (y2 - y1) / 2;
    return ret;
  }

  static interpolateTrianglePerspective(x1, y1, z1, uv1, x2, y2, z2, uv2, x3, y3, z3, uv3, px, py) {
    var px1, py1, px2, py2, px3, py3, xP, yP, zP;

    //Perspective (hyperbolic) triangle interpolation ------------------------------------
    px1 = 0;
    py1 = 0;
    px2 = 0;
    py2 = 0;
    px3 = 0;
    py3 = 0;
    xP = 0;
    yP = 0;
    zP = 0;

    //1. Invert Z values (because Z gets greater as we move further into the picture, but the equations do the opposite)
    z1 = 1 / z1;
    z2 = 1 / z2;
    z3 = 1 / z3;

    //2. Linearly interpolate the Z coordinate for the input point
    zP = 1 / Plane.interpolateTriangleLinear(x1, y1, z1, x2, y2, z2, x3, y3, z3, px, py);

    //3. Project the input point
    xP = (px * zP);
    yP = (py * zP);

    //4. Project the triangle points
    px1 = (x1 / z1);
    py1 = (y1 / z1);
    px2 = (x2 / z2);
    py2 = (y2 / z2);
    px3 = (x3 / z3);
    py3 = (y3 / z3);

    //5. Linearly interpolate the value of the projected point in the projected triangle (perspective correction)
    return Plane.interpolateTriangleLinear(px1, py1, uv1, px2, py2, uv2, px3, py3, uv3, xP, yP);
  };
  static interpolateTriangleLinear(x1, y1, uv1, x2, y2, uv2, x3, y3, uv3, px, py) {

    var d, u, v, w;

    //Linear triangle interpolation ------------------------------------
    d = 0;
    u = 0;
    v = 0;
    w = 0;

    d = 1 / (((x2 - x1) * (y3 - y1)) - ((y2 - y1) * (x3 - x1)));
    //divisor (pre-computed for speed)

    u = (((x2 - px) * (y3 - py)) - ((y2 - py) * (x3 - px))) * d;
    v = (((x3 - px) * (y1 - py)) - ((y3 - py) * (x1 - px))) * d;
    w = 1 - (u + v);

    return (u * uv1) + (v * uv2) + (w * uv3);
  };


  screenToUV(px, py) {
    var u = Plane.interpolateTrianglePerspective(
      this.pa.x, this.pa.y, this.a.z, 0,
      this.pb.x, this.pb.y, this.b.z, 0,
      this.pc.x, this.pc.y, this.c.z, this.uvWidth, px, py);
    var v = Plane.interpolateTrianglePerspective(
      this.pa.x, this.pa.y, this.a.z, 0,
      this.pb.x, this.pb.y, this.b.z, this.uvHeight,
      this.pc.x, this.pc.y, this.c.z, this.uvHeight, px, py);
    return new Point2(u, v);
  };

  uvToScreen(pu, pv) {
    var z = Plane.interpolateTriangleLinear(
      0, 0, this.a.z,
      0, this.uvHeight, this.b.z,
      this.uvWidth, this.uvHeight, this.c.z, pu, pv);

    var px = Plane.interpolateTriangleLinear(
      0, 0, this.pa.x * this.a.z,
      0, this.uvHeight, this.pb.x * this.b.z,
      this.uvWidth, this.uvHeight, this.pc.x * this.c.z, pu, pv) / z;

    var py = Plane.interpolateTriangleLinear(
      0, 0, this.pa.y * this.a.z,
      0, this.uvHeight, this.pb.y * this.b.z,
      this.uvWidth, this.uvHeight, this.pc.y * this.c.z, pu, pv) / z;
    // this is a hack to fix negative z value cases causing wrong projected points
    if (z < 0) {
      return errorNegativeZ;
    }
    return new Point2(px, py);
  };
}

function findCenterPoint(a, b, c, d) {
  //finds the center between FOUR points
	//to find the centerpoint between just TWO points (not four), then enter CenterPoint(a, b, a, b)
	var x1, x2, y1, y2;
	var ab, cd;
	ab = new Point2(0, 0);
	cd = new Point2(0, 0);

	//find the center between a and b
	if (a.x > b.x) { x1 = b.x; x2 = a.x; } else x1 = a.x; x2 = b.x;
	if (a.y > b.y) { y1 = b.y; y2 = a.y; } else y1 = a.y; y2 = b.y;
	ab.x = x1 + (x2 - x1) / 2;
	ab.y = y1 + (y2 - y1) / 2;

	//find the center between c and d
	if (c.x > d.x) { x1 = d.x; x2 = c.x; } else x1 = c.x; x2 = d.x;
	if (c.y > d.y) { y1 = d.y; y2 = c.y; } else y1 = c.y; y2 = d.y;
	cd.x = x1 + (x2 - x1) / 2;
	cd.y = y1 + (y2 - y1) / 2;

	//find the center between ab and cd
	if (ab.x > cd.x) { x1 = cd.x; x2 = ab.x; } else x1 = ab.x; x2 = cd.x;
	if (ab.y > cd.y) { y1 = cd.y; y2 = ab.y; } else y1 = ab.y; y2 = cd.y;

	var ret = new Point2(0, 0);
	ret.x = x1 + (x2 - x1) / 2;
	ret.y = y1 + (y2 - y1) / 2;
	return ret;
}

function interpolateTrianglePerspective(x1, y1, z1, uv1,
	x2, y2, z2, uv2,
	x3, y3, z3, uv3,
	px, py) {
	var px1, py1, px2, py2, px3, py3, xP, yP, zP;

	//Perspective (hyperbolic) triangle interpolation ------------------------------------
	px1 = 0; py1 = 0; px2 = 0; py2 = 0; px3 = 0; py3 = 0;
	xP = 0; yP = 0; zP = 0;

	//1. Invert Z values (because Z gets greater as we move further into the picture, but the equations do the opposite)
	z1 = 1 / z1; z2 = 1 / z2; z3 = 1 / z3;

	//2. Linearly interpolate the Z coordinate for the input point
	zP = 1 / interpolateTriangleLinear(x1, y1, z1, x2, y2, z2, x3, y3, z3, px, py);

	//3. Project the input point
	xP = (px * zP); yP = (py * zP);

	//4. Project the triangle points
	px1 = (x1 / z1); py1 = (y1 / z1);
	px2 = (x2 / z2); py2 = (y2 / z2);
	px3 = (x3 / z3); py3 = (y3 / z3);

	//5. Linearly interpolate the value of the projected point in the projected triangle (perspective correction)
	return interpolateTriangleLinear(px1, py1, uv1, px2, py2, uv2, px3, py3, uv3, xP, yP);
}

function interpolateTriangleLinear(x1, y1, uv1,
	x2, y2, uv2,
	x3, y3, uv3,
	px, py) {

	var d, u, v, w;

	//Linear triangle interpolation ------------------------------------
	d = 0; u = 0; v = 0; w = 0;

	d = 1 / (((x2 - x1) * (y3 - y1)) - ((y2 - y1) * (x3 - x1)));  //divisor (pre-computed for speed)

	u = (((x2 - px) * (y3 - py)) - ((y2 - py) * (x3 - px))) * d;
	v = (((x3 - px) * (y1 - py)) - ((y3 - py) * (x1 - px))) * d;
	w = 1 - (u + v);

	return (u * uv1) + (v * uv2) + (w * uv3);
}


function findIntersect(a, b, c, d) {
  //finds intersection between line a-b and line c-d
  var a1 = 0, a2 = 0, b1 = 0, b2 = 0, c1 = 0, c2 = 0;
  var m = 0, bb = 0;
  var cp = new Point2(0, 0);
  var ret = new Point2(0, 0);

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

function length2D(a, b) {
  //calculates the distance between two points in 2d space
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}
