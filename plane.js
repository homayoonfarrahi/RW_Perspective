var Geometry = (function(Geometry) {

    // Cross-File Private State
    var _private = Geometry._private = Geometry._private || {},
        _seal = Geometry._seal = Geometry._seal || function() {
            delete Geometry._private;
            delete Geometry._seal;
            delete Geometry._unseal;
        },
        _unseal = Geometry._unseal = Geometry._unseal || function() {
            Geometry._private = _private;
            Geometry._seal = _seal;
            Geometry._unseal = _unseal;
        };

    Geometry.Plane = function(screenPointA, screenPointB, screenPointC, screenPointD, uvWidth, uvHeight) {
        this.uvWidth = uvWidth;
        this.uvHeight = uvHeight;

        this.vh = null;
        // Horizontal vanishing point
        this.vv = null;
        // Vertical vanishing point
        this.cp = null;
        // Central vanishing point
        this.pa = screenPointA;
        // 2D location of perspective point
        this.pb = screenPointB;
        // 2D location of perspective point
        this.pc = screenPointC;
        // 2D location of perspective point
        this.pd = screenPointD;
        // 2D location of perspective point
        this.a = new Geometry.Point3D(0, 0, 0);
        // 3D location of perspective point
        this.b = new Geometry.Point3D(0, 0, 0);
        // 3D location of perspective point
        this.c = new Geometry.Point3D(0, 0, 0);
        // 3D location of perspective point
        this.d = new Geometry.Point3D(0, 0, 0);
        // 3D location of perspective point
        this.tr_ac = null;
        // 2D transverse intersection point with vh-vv horizon line
        this.tr_bd = null;
        // 2D transverse intersection point with vh-vv horizon line

        this.computeZforProjectedPlane = function() {
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
            this.vh = Geometry.Line.findIntersect(this.pa, this.pd, this.pb, this.pc);
            //horizontal vanishing point of projected plane
            this.vv = Geometry.Line.findIntersect(this.pa, this.pb, this.pc, this.pd);
            //vertical vanishing point of projected plane
            this.cp = Geometry.Line.findIntersect(this.pa, this.pc, this.pb, this.pd);
            //center point of projected plane

            //1b. Compute transverse points (these are the lines that go through a-c & b-d (criss-cross), and intersect the horizon line of .vh-.vv)
            this.tr_ac = Geometry.Line.findIntersect(this.pa, this.pc, this.vh, this.vv);
            this.tr_bd = Geometry.Line.findIntersect(this.pb, this.pd, this.vh, this.vv);

            //2. Get length to vanishing points
            avh = Geometry.Line.length2D(this.pa, this.vh);
            avv = Geometry.Line.length2D(this.pa, this.vv);
            bvh = Geometry.Line.length2D(this.pb, this.vh);
            bvv = Geometry.Line.length2D(this.pb, this.vv);
            cvh = Geometry.Line.length2D(this.pc, this.vh);
            cvv = Geometry.Line.length2D(this.pc, this.vv);
            dvh = Geometry.Line.length2D(this.pd, this.vh);
            dvv = Geometry.Line.length2D(this.pd, this.vv);

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

        Geometry.Plane.findCenterPoint = function(a, b, c, d) {
            //finds the center between FOUR points
            //to find the centerpoint between just TWO points (not four), then enter CenterPoint(a, b, a, b)
            var x1, x2, y1, y2;
            var ab, cd;
            ab = new Geometry.Point2D(0, 0);
            cd = new Geometry.Point2D(0, 0);

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

            var ret = new Geometry.Point2D(0, 0);
            ret.x = x1 + (x2 - x1) / 2;
            ret.y = y1 + (y2 - y1) / 2;
            return ret;
        }

        Geometry.Plane.interpolateTrianglePerspective = function(x1, y1, z1, uv1, x2, y2, z2, uv2, x3, y3, z3, uv3, px, py) {
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
            zP = 1 / Geometry.Plane.interpolateTriangleLinear(x1, y1, z1, x2, y2, z2, x3, y3, z3, px, py);

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
            return Geometry.Plane.interpolateTriangleLinear(px1, py1, uv1, px2, py2, uv2, px3, py3, uv3, xP, yP);
        };

        Geometry.Plane.interpolateTriangleLinear = function(x1, y1, uv1, x2, y2, uv2, x3, y3, uv3, px, py) {

            var d, u, v, w;

            //Linear triangle interpolation ------------------------------------
            d = 0;
            u = 0;
            v = 0;
            w = 0;

            // FIXME d becomes infinity when drawing an exact trapezoid, causing NaNs
            // {x: 200, y: 200}, {x: 200, y: 400}, {x: 400, y: 500}, {x: 400, y: 100}
            d = 1 / (((x2 - x1) * (y3 - y1)) - ((y2 - y1) * (x3 - x1)));
            //divisor (pre-computed for speed)

            u = (((x2 - px) * (y3 - py)) - ((y2 - py) * (x3 - px))) * d;
            v = (((x3 - px) * (y1 - py)) - ((y3 - py) * (x1 - px))) * d;
            w = 1 - (u + v);

            return (u * uv1) + (v * uv2) + (w * uv3);
        };

        var toRadians = function(degree) {
            return degree * (Math.PI / 180);
        };

        this.screenToUV = function(px, py) {
            var u = Geometry.Plane.interpolateTrianglePerspective(
                this.pa.x, this.pa.y, this.a.z, 0,
                this.pb.x, this.pb.y, this.b.z, 0,
                this.pc.x, this.pc.y, this.c.z, this.uvWidth, px, py);
            var v = Geometry.Plane.interpolateTrianglePerspective(
                this.pa.x, this.pa.y, this.a.z, 0,
                this.pb.x, this.pb.y, this.b.z, this.uvHeight,
                this.pc.x, this.pc.y, this.c.z, this.uvHeight, px, py);
            return new Geometry.Point2D(u, v);
        };

        this.uvToScreen = function(pu, pv) {
            var z = Geometry.Plane.interpolateTriangleLinear(
                0, 0, this.a.z,
                0, this.uvHeight, this.b.z,
                this.uvWidth, this.uvHeight, this.c.z, pu, pv);

            var px = Geometry.Plane.interpolateTriangleLinear(
                0, 0, this.a.x,
                0, this.uvHeight, this.b.x,
                this.uvWidth, this.uvHeight, this.c.x, pu, pv) / z;

            var py = Geometry.Plane.interpolateTriangleLinear(
                0, 0, this.a.y,
                0, this.uvHeight, this.b.y,
                this.uvWidth, this.uvHeight, this.c.y, pu, pv) / z;

            // this is a hack to fix negative z value cases causing wrong projected points
            if (z < 0) {
                errorNegativeZ = 'error negative z';
                return errorNegativeZ;
            }
            return new Geometry.Point2D(px, py);
        };

        this.translate = function(vec) {
          this.a.add(vec);
          this.b.add(vec);
          this.c.add(vec);
          this.d.add(vec);
        }

        this.rotate = function() {
          // console.log(this.a)
          // console.log(this.b)
          // console.log(this.c)
          // console.log(this.d)
          var degree = 20;
          var rotationPoint = this.a.clone();
          var cosVal = Math.cos(toRadians(degree));
          var sinVal = Math.sin(toRadians(degree));

          var ab = this.b.clone().subtract(this.a);
          var ad = this.d.clone().subtract(this.a);
          var normal = ab.crossProduct(ad);
          var axis = normal;
          console.log(axis)

          var rotationMatrix = [
            [cosVal + Math.pow(axis.x, 2) * (1 - cosVal), axis.x * axis.y * (1 - cosVal) - axis.z * sinVal, axis.x * axis.z * (1 - cosVal) + axis.y * sinVal],
            [axis.y * axis.x * (1 - cosVal) + axis.z * sinVal, cosVal + Math.pow(axis.y, 2) * (1 - cosVal), axis.y * axis.z * (1 - cosVal) - axis.x * sinVal],
            [axis.z * axis.x * (1 - cosVal) - axis.y * sinVal, axis.z * axis.y * (1 - cosVal) + axis.x * sinVal, cosVal + Math.pow(axis.z, 2) * (1 - cosVal)]
          ];

          this.translate(rotationPoint.clone().multiplyBy(-1));

          this.a.setToColumnMatrix(math.multiply(rotationMatrix, this.a.getColumnMatrix()));

          this.b.setToColumnMatrix(math.multiply(rotationMatrix, this.b.getColumnMatrix()));

          this.c.setToColumnMatrix(math.multiply(rotationMatrix, this.c.getColumnMatrix()));

          this.d.setToColumnMatrix(math.multiply(rotationMatrix, this.d.getColumnMatrix()));

          this.translate(rotationPoint);
        }

        this.computeZforProjectedPlane();
    }

    return Geometry;

})(Geometry || {});
