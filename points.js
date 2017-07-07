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

    _private.Point2D = function(x, y) {
        this.x = x;
        this.y = y;

        this.clone = function() {
            return new _private.Point2D(this.x, this.y);
        }

        this.clone2D = function() {
            return new _private.Point2D(this.x, this.y);
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
    }

    _private.Point3D = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.clone2D = function() {
            return new _private.Point2D(this.x, this.y);
        }
    }

    return pTool;

})(pTool || {});
