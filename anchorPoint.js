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

    _private.AnchorPoint = function(point, circle, anchorLine) {
        this.associatedCircle = circle;
        this.position = point;
        this.anchorLine = anchorLine;
        this.perspectiveTool = anchorLine.perspectiveTool;
        this.paper = anchorLine.paper;

        this.handle = this.paper.circle(this.position.x, this.position.y, 10);
        this.handle.attr('fill', _private.PerspectiveToolSettings.anchorLine.handle.fillIdle);
        this.handle.attr('opacity', _private.PerspectiveToolSettings.anchorLine.handle.opacity);
        var initialHandlePos = undefined;
        var dragging = false;
        var hoverIn = function() {
            var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);
            if (movementDirection === 'horizontal') {
                this.perspectiveTool.setCursor('ew-resize');
            } else if (movementDirection === 'vertical') {
                this.perspectiveTool.setCursor('ns-resize');
            }
            this.handle.attr('fill', _private.PerspectiveToolSettings.anchorLine.handle.fillHoverIn);
        }.bind(this);

        var hoverOut = function() {
            this.perspectiveTool.setCursor('auto');
            if (!dragging) {
                this.handle.attr('fill', _private.PerspectiveToolSettings.anchorLine.handle.fillIdle);
            }
        }

        var drag = function(dx, dy, x, y, event) {
            var oppositeCircle = this.anchorLine.getCircleOppositeToAnchorPoint(this);
            var lines = this.anchorLine.anchorSystem.getAnchorLinesForCircle(this.associatedCircle);
            var movementAnchorLine = null;
            for (var i = 0; i < lines.length; i++) {
                if (lines[i] !== this.anchorLine) {
                    movementAnchorLine = lines[i];
                    break;
                }
            }

            var p1 = initialHandlePos.clone().add(new _private.Point2D(dx, dy));
            var p2 = new _private.Point2D(oppositeCircle.circle.attr('cx'), oppositeCircle.circle.attr('cy'));
            var intersect = new _private.Line(p1, p2).findIntersectWithLine(movementAnchorLine.getLine());

            intersect = this.perspectiveTool.getSnap().suggestPosition(this.perspectiveTool, intersect, movementAnchorLine.getLine().getDirection());

            var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);

            if (movementDirection == 'horizontal') {
                this.perspectiveTool.setCursor('ew-resize');
            } else if (movementDirection == 'vertical') {
                this.perspectiveTool.setCursor('ns-resize');
            }

            if (this.anchorLine.anchorSystem.isCirclePositionInvalid(this.associatedCircle, intersect.clone())) {
                return;
            }

            this.associatedCircle.point.x = intersect.x;
            this.associatedCircle.point.y = intersect.y;
            this.anchorLine.anchorSystem.update();
            this.perspectiveTool.update();
        };

        var dragStart = function(x, y, event) {
            _private.isDragging = true;
            dragging = true;
            initialHandlePos = this.position.clone();

            var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);
            if (movementDirection === 'horizontal') {
                this.perspectiveTool.setCursor('ew-resize');
            } else if (movementDirection === 'vertical') {
                this.perspectiveTool.setCursor('ns-resize');
            }
        };

        var dragEnds = function(event) {
            _private.isDragging = false;
            this.handle.attr('fill', _private.PerspectiveToolSettings.anchorLine.handle.fillIdle);
            this.perspectiveTool.setCursor('auto');
            dragging = false;
        };

        this.handle.hover(hoverIn.bind(this), hoverOut.bind(this));

        this.handle.drag(drag.bind(this), dragStart.bind(this), dragEnds.bind(this));

        this.setPaperInstance = function(paper) {
            this.paper = paper;
        }

        this.setPosition = function(pos) {
            this.position.setTo(pos);
            this.handle.transform('t' + this.position.x + ',' + this.position.y);
        }

        this.addAnchorHandlesToSet = function(set) {
            set.push(this.handle);
        }

        this.update = function() {
            if (!this.anchorLine.anchorSystem.isCloseToRegion(this.anchorLine.circle1.point, -this.anchorLine.circle1.radius) &&
                !this.anchorLine.anchorSystem.isCloseToRegion(this.anchorLine.circle2.point, -this.anchorLine.circle2.radius)) {
                this.handle.hide();
            } else {
                this.handle.show();
            }
        }

        this.hide = function() {
          this.handle.hide();
        }

        this.show = function() {
          this.handle.show();
        }
    }

    return pTool;

})(pTool || {});
