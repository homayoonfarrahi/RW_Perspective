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

    _private.RotationUI = function(vertices, perspectiveTool, paper) {
      this.vertices = vertices;
      this.perspectiveTool = perspectiveTool;
      this.paper = paper;

      var iconSize = new Geometry.Point2D(25, 25);
      var handles = [];
      var rotationLogic;

      this.init = function() {
        for (var i = 0; i < this.vertices.length; i++) {
          handle = this.paper.image("icon_rotate.png", 0, 0, iconSize.x, iconSize.y);

          (function(i, handle) {
            var hoverIn = function() {
              handles[i].attr('width', iconSize.x * 1.5);
              handles[i].attr('height', iconSize.y * 1.5);
              this.update();
            }.bind(this);

            var hoverOut = function() {
              handles[i].attr('width', iconSize.x);
              handles[i].attr('height', iconSize.y);
              this.update();
            }.bind(this);

            var dragStart = function(x, y, event) {
              rotationLogic = new _private.RotationLogic(this.vertices, this.perspectiveTool);

              // temporarily rotate 90 degrees
              var newPositions = rotationLogic.rotate(i);
              for (var j = 0; j < this.vertices.length; j++) {
                this.vertices[j].setTo(newPositions[j]);
              }

              this.perspectiveTool.update();
            }.bind(this);

            var dragMove = function(dx, dy, x, y, event) {
              hoverIn();
              var movementDirection = this.vertices[(i + 1) % 4].clone().subtract(this.vertices[i]);
              var movement = new Geometry.Point2D(dx, dy).projectOnVector(movementDirection);
              var rotationAngle = Math.sign(movement.clone().dotProduct(movementDirection)) * movement.getLength();

              // TODO implement the rotation logic here
            }.bind(this);

            var dragEnd = function() {
              hoverOut();
            }

            handle.hover(hoverIn, hoverOut);
            handle.drag(dragMove, dragStart, dragEnd);
          }.bind(this))(i, handle);

          handles.push(handle);
        }
      }

      this.update = function() {
        for (var i = 0; i < handles.length; i++) {
          var handlePos = this.vertices[i].clone().add(this.vertices[(i + 1) % 4]).divideBy(2);
          var iconAngle = new Geometry.Line(this.vertices[i], this.vertices[(i + 1) % 4]).getAngle() - 90;
          handles[i].transform('t' + handlePos.x + ',' + handlePos.y + 't' + -handles[i].attr('width') / 2 + ',' + -handles[i].attr('height') / 2 + 'r' + iconAngle);
        }
      }

      this.init();
      this.update();
    }

    return pTool;
})(pTool || {});
