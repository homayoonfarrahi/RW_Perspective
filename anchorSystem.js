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

    _private.AnchorSystem = function(boundaries, circles, perspectiveTool, paper) {
        this.anchorLines = [];
        this.boundaries = boundaries;
        this.circles = circles;
        this.minX = boundaries[0];
        this.maxX = boundaries[1];
        this.minY = boundaries[2];
        this.maxY = boundaries[3];
        this.perspectiveTool = perspectiveTool;
        this.paper = paper;

        setCursor = function(cursor) {
            //setTimeout("document.body.style.cursor = '" + cursor + "'", 0);
            pTool.PerspectiveTool.getPaper().canvas.style.cursor = cursor;
        }

        this.addAnchorLine = function(circle1, circle2) {
            var anchorLine = new _private.AnchorLine(circle1, circle2, this);
            this.anchorLines.push(anchorLine);
        }

        this.isInsideBoundaries = function(p) {
            if (p.x >= this.minX && p.x <= this.maxX && p.y >= this.minY && p.y <= this.maxY) {
                return true;
            } else {
                return false;
            }
        }

        this.isCloseToRegion = function(p, maxDistance) {
            if (p.x >= this.minX - maxDistance && p.x <= this.maxX + maxDistance &&
                p.y >= this.minY - maxDistance && p.y <= this.maxY + maxDistance) {
                return true;
            } else {
                return false;
            }
        }

        this.setPaperInstance = function(paper) {
            this.paper = paper;
        }

        this.getAnchorLinesForCircle = function(circle) {
            var result = [];
            for (var i = 0; i < this.anchorLines.length; i++) {
                if (this.anchorLines[i].circle1 === circle || this.anchorLines[i].circle2 === circle) {
                    result.push(this.anchorLines[i]);
                }
            }

            return result;
        }

        this.getMovementDirection = function(anchorPoint) {
            if (anchorPoint.position.x === this.minX || anchorPoint.position.x === this.maxX) {
                return 'vertical';
            } else if (anchorPoint.position.y === this.minY || anchorPoint.position.y === this.maxY) {
                return 'horizontal';
            }
        }

        this.addAnchorHandlesToSet = function(set) {
            for (var i = 0; i < this.anchorLines.length; i++) {
                this.anchorLines[i].addAnchorHandlesToSet(set);
            }
        }

        this.addAnchorLinesToSet = function(set) {
            for (var i = 0; i < this.anchorLines.length; i++) {
                this.anchorLines[i].addAnchorLinesToSet(set);
            }
        }

        this.isCirclePositionInvalid = function(circle, newPos) {
            var i = 0;
            for (i = 0; i < circles.length; i++) {
                if (circles[i] === circle) {
                    break;
                }
            }

            var positions = [circles[0].point, circles[1].point, circles[2].point, circles[3].point];
            positions[i] = newPos;

            var crossProductZs = [];
            for (var index = 0; index < positions.length; index++) {
                var prevIndex = (index + positions.length - 1) % positions.length;
                var nextIndex = (index + 1) % positions.length;

                var vec1 = positions[prevIndex].clone().subtract(positions[index]);
                var vec2 = positions[nextIndex].clone().subtract(positions[index]);

                var crossProductZ = (vec1.x * vec2.y) - (vec1.y * vec2.x);
                crossProductZs.push(crossProductZ);
            }

            for (var i = 0; i < crossProductZs.length - 1; i++) {
                if (crossProductZs[i] * crossProductZs[i + 1] < 0) {
                    return true;
                }
            }

            return false;
        }

        this.update = function() {
            for (var i = 0; i < this.anchorLines.length; i++) {
                this.anchorLines[i].update();
            }
        }

        this.addAnchorLine(circles[0], circles[1]);
        this.addAnchorLine(circles[1], circles[2]);
        this.addAnchorLine(circles[2], circles[3]);
        this.addAnchorLine(circles[3], circles[0]);
    }

    return pTool;

})(pTool || {});
