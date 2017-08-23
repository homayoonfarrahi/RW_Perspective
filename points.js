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

    Geometry.Point2D = function(x, y) {
        this.x = x;
        this.y = y;

        this.clone = function() {
            return new Geometry.Point2D(this.x, this.y);
        }

        this.clone2D = function() {
            return new Geometry.Point2D(this.x, this.y);
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

        this.multiplyBy = function(scalar) {
            this.x *= scalar;
            this.y *= scalar;

            return this;
        }

        this.divideBy = function(scalar) {
            if (scalar === 0) {
                console.error('Cannot divide a point by zero.');
                return this;
            }

            this.x /= scalar;
            this.y /= scalar;

            return this;
        }

        this.distanceFromPoint = function(p) {
            return Math.sqrt((this.x - p.x) * (this.x - p.x) + (this.y - p.y) * (this.y - p.y));
        }

        this.setTo = function(p) {
            this.x = p.x;
            this.y = p.y;
            return this;
        }

        this.normalize = function() {
            var length = Math.sqrt((this.x * this.x) + (this.y * this.y));
            return this.divideBy(length);
        }

        this.dotProduct = function(other) {
          return this.x * other.x + this.y * other.y;
        }

        this.projectOnVector = function(v) {
          var projectedVec = new Geometry.Point2D(v.x, v.y);
          return projectedVec.multiplyBy(this.clone().dotProduct(v) / v.clone().dotProduct(v));
        }

        this.getLength = function() {
          return Math.sqrt((this.x * this.x) + (this.y * this.y));
        }
    }

    Geometry.Point3D = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.clone = function() {
          return new Geometry.Point3D(this.x, this.y, this.z);
        }

        this.clone2D = function() {
            return new Geometry.Point2D(this.x, this.y);
        }

        this.add = function(p) {
            this.x += p.x;
            this.y += p.y;
            this.z += p.z;

            return this;
        }

        this.subtract = function(p) {
            this.x -= p.x;
            this.y -= p.y;
            this.z -= p.z;

            return this;
        }

        this.multiplyBy = function(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            this.z *= scalar;

            return this;
        }

        this.divideBy = function(scalar) {
            if (scalar === 0) {
                console.error('Cannot divide a point by zero.');
                return this;
            }

            this.x /= scalar;
            this.y /= scalar;
            this.z /= scalar;

            return this;
        }

        this.normalize = function() {
            var length = Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
            return this.divideBy(length);
        }

        this.crossProduct = function(p) {
          var s1 = this.y * p.z - this.z * p.y;
          var s2 = this.z * p.x - this.x * p.z;
          var s3 = this.x * p.y - this.y * p.x;

          return new Geometry.Point3D(s1, s2, s3).normalize();
        }

        this.findIntersectWithPlaneZ = function(z) {
          var multiplier = z / this.z;
          return this.clone().multiplyBy(multiplier);
        }

        this.getColumnMatrix = function() {
          return [
            [this.x],
            [this.y],
            [this.z]
          ];
        }

        this.setToColumnMatrix = function(matrix) {
          this.x = matrix[0][0];
          this.y = matrix[1][0];
          this.z = matrix[2][0];
        }

        var toRadians = function(degree) {
            return degree * (Math.PI / 180);
        };

        this.rotate = function(axis, angle) {
          var cosVal = Math.cos(toRadians(angle));
          var sinVal = Math.sin(toRadians(angle));

          var rotationMatrix = [
            [cosVal + Math.pow(axis.x, 2) * (1 - cosVal), axis.x * axis.y * (1 - cosVal) - axis.z * sinVal, axis.x * axis.z * (1 - cosVal) + axis.y * sinVal],
            [axis.y * axis.x * (1 - cosVal) + axis.z * sinVal, cosVal + Math.pow(axis.y, 2) * (1 - cosVal), axis.y * axis.z * (1 - cosVal) - axis.x * sinVal],
            [axis.z * axis.x * (1 - cosVal) - axis.y * sinVal, axis.z * axis.y * (1 - cosVal) + axis.x * sinVal, cosVal + Math.pow(axis.z, 2) * (1 - cosVal)]
          ];

          result =  this.clone();
          result.setToColumnMatrix(math.multiply(rotationMatrix, this.getColumnMatrix()));
          return result;
        }
    }

    return Geometry;

})(Geometry || {});
