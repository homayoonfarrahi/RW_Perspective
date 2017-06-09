function Point2D(x, y) {
  this.x = x;
  this.y = y;

  this.clone = function() {
    return new Point2D(this.x, this.y);
  }

  this.clone2D = function() {
    return new Point2D(this.x, this.y);
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

function Point3D(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;

  this.clone2D = function() {
    return new Point2D(this.x, this.y);
  }
}

