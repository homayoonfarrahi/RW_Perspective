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

    pTool.PerspectiveTool = new function() {
        this.centers = [
            new _private.Point2D(256, 498),
            new _private.Point2D(255, 673),
            new _private.Point2D(486, 607),
            new _private.Point2D(445, 455)
        ];

        var paper;
        var divSize;
        var divOffset;
        var screenSpaceMovement = false;
        var self = this;
        var circles = [];
        var paths = [];
        var fillerPath;
        var backgroundSet;
        var nonInteractableSet;
        var fillerSet;
        var planeEdgeSet;
        var planeVertexSet;
        var anchorHandleSet;
        _private.isDragging = false;

        var anchorSystem;
        var grid;
        var plane;
        var measurementsUI;

        var getPathString = function getPathString(circle1, circle2) {
            var startX = circle1.circle.attr('cx');
            var startY = circle1.circle.attr('cy');
            var endX = circle2.circle.attr('cx');
            var endY = circle2.circle.attr('cy');
            var pathString = 'M' + startX + ',' + startY + 'L' + endX + ',' + endY;

            return pathString;
        }

        var getClosedPathString = function getClosedPathString() {
            var pathString = 'M' + circles[0].circle.attr('cx') + ',' + circles[0].circle.attr('cy');

            for (var i = 1; i < circles.length; i++) {
                pathString += 'L' + circles[i].circle.attr('cx') + ',' + circles[i].circle.attr('cy');
            }

            pathString += 'Z';

            return pathString;
        }

        var updateCircles = function updateCircles() {
            for (var i = 0; i < circles.length; i++) {
                circles[i].circle.attr('cx', self.centers[i].x);
                circles[i].circle.attr('cy', self.centers[i].y);
            }
        }

        var updatePaths = function updatePaths() {
            for (var i = 0; i < paths.length; i++) {
                var pathString = getPathString(paths[i].circle1, paths[i].circle2)
                paths[i].path.attr('path', pathString);
            }
        }

        var updatePathsForCircle = function updatePathsForCircle(circle) {
            var i = 0;
            for (i = 0; i < circles.length; i++) {
                if (circles[i].circle === circle) break;
            }

            var path1 = circles[i].path1;
            path1.path.attr('path', getPathString(path1.circle1, path1.circle2));

            var path2 = circles[i].path2;
            path2.path.attr('path', getPathString(path2.circle1, path2.circle2));
        };

        var updateFillerPath = function updateFillerPath() {
            var pathString = getClosedPathString();
            fillerPath.attr('path', pathString);
        };

        var toRadians = function(degree) {
            return degree * (Math.PI / 180);
        };

        var getCursorStyleForSlope = function(slope) {
            if (slope === undefined) {
                return 'ns-resize';
            }

            var slopeRadian = Math.atan(slope);
            if (slopeRadian >= toRadians(-90) && slopeRadian < toRadians(-67.5) ||
                slopeRadian >= toRadians(67.5) && slopeRadian <= toRadians(90)) {
                return 'ns-resize';
            } else if (slopeRadian >= toRadians(-67.5) && slopeRadian < toRadians(-22.5)) {
                return 'nesw-resize';
            } else if (slopeRadian >= toRadians(-22.5) && slopeRadian < toRadians(22.5)) {
                return 'ew-resize';
            } else if (slopeRadian >= toRadians(22.5) && slopeRadian < toRadians(67.5)) {
                return 'nwse-resize';
            }
        };

        function isPolygonConcave(positions) {
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

        function perspectivePointsAreInvalid(a, b, c, d) {
            errorNegativeZ = 'error negative z';
            return (a == errorNegativeZ || b == errorNegativeZ || c == errorNegativeZ || d == errorNegativeZ) ||
                (Math.abs(a.x - c.x) < 5 || Math.abs(a.y - c.y) < 5);
        }

        this.isDragging = function() {
            return _private.isDragging;
        }

        this.hide = function() {
            $(paper.canvas).hide();
        }

        this.show = function() {
            $(paper.canvas).show();
        }

        this.getPaper = function() {
            return paper;
        }

        this.setDimensions = function(wf, hf) {
            this.widthFeet = wf;
            this.heightFeet = hf;
            grid.setDimensions(wf, hf);
            measurementsUI.updateDimensions();
        }

        this.init = function(element, widthFeet, heightFeet) {
            if (!paper) {
                document.onkeydown = function(e) {
                    if (e.key === 'Control') {
                        screenSpaceMovement = true;
                    }
                }
                document.onkeyup = function(e) {
                    if (e.key === 'Control') {
                        screenSpaceMovement = false;
                    }
                }

                var divOffsetX = $(element).offset().left;
                var divOffsetY = $(element).offset().top;

                divOffset = new _private.Point2D(divOffsetX, divOffsetY);
                divSize = new _private.Point2D(widthFeet, heightFeet);

                paper = Raphael(element, divSize.x, divSize.y);
            }

            backgroundSet = paper.set();
            nonInteractableSet = paper.set();
            fillerSet = paper.set();
            planeEdgeSet = paper.set();
            planeVertexSet = paper.set();
            anchorHandleSet = paper.set();


            // var image = paper.image("outdoor.jpg", 0, 0, divSize.x, divSize.y);
            // backgroundSet.push(image);

            for (var i = 0; i < 4; i++) {
                var radius = 7;
                var circle = paper.circle(this.centers[i].x, this.centers[i].y, radius);
                circle.attr('fill', _private.PerspectiveToolSettings.planeVertex.fillIdle);
                circle.attr('opacity', _private.PerspectiveToolSettings.planeVertex.opacity);

                (function(i, circle) {
                    var initialCirclePos = undefined;

                    var circleDragMove = function(dx, dy, x, y, event) {
                        var i = 0;
                        for (i = 0; i < circles.length; i++) {
                            if (circles[i].circle === circle) break;
                        }

                        var newPos = initialCirclePos.clone().add(new _private.Point2D(dx, dy));
                        var tmpPositions = [
                            self.centers[0],
                            self.centers[1],
                            self.centers[2],
                            self.centers[3]
                        ];
                        tmpPositions[i] = newPos;
                        if (isPolygonConcave(tmpPositions)) {
                            return;
                        }

                        circles[i].point.setTo(newPos);
                        updateCircles();
                        updatePathsForCircle(circle);
                        updateFillerPath();
                        anchorSystem.update();
                        grid.update();
                        measurementsUI.update(self.centers);
                    }

                    var circleDragStart = function(x, y, event) {
                        _private.isDragging = true;
                        initialCirclePos = new _private.Point2D(circle.attr('cx'), circle.attr('cy'));
                    }

                    var circleDragEnd = function(event) {
                        _private.isDragging = false;
                    }

                    var circleHoverIn = function() {
                        circle.attr('fill', _private.PerspectiveToolSettings.planeVertex.fillHoverIn);
                        setCursor('move');
                    }

                    var circleHoverOut = function() {
                        circle.attr('fill', _private.PerspectiveToolSettings.planeVertex.fillIdle);
                        setCursor('default');
                    }

                    circle.drag(circleDragMove, circleDragStart, circleDragEnd);
                    circle.hover(circleHoverIn, circleHoverOut);
                })(i, circle);
                planeVertexSet.push(circle);

                circles.push({
                    circle: circle,
                    point: this.centers[i],
                    radius: radius,
                    path1: undefined,
                    path2: undefined,
                });
            }

            for (var from = 0; from < circles.length; from++) {
                var to = from + 1;
                if (to >= circles.length) {
                    to = 0;
                }

                function getCenter(i) {
                    return self.centers[i % 4];
                }
                var pathString = getPathString(circles[from], circles[to]);
                var path = paper.path(pathString);

                (function(from, path) {
                    var vanishingPoint;
                    var otherLine1;
                    var otherLine2;
                    var movementPoint;
                    var dragging = false;
                    var edgeDragStart = function(x, y) {
                        _private.isDragging = true;
                        dragging = true;
                        otherLine1 = new _private.Line(getCenter(from), getCenter(from + 3));
                        otherLine2 = new _private.Line(getCenter(from + 1), getCenter(from + 2));
                        vanishingPoint = new _private.Line(getCenter(from), getCenter(from + 1)).findIntersectWithLine(new _private.Line(getCenter(from + 2), getCenter(from + 3)));
                        movementPoint = new _private.Line(getCenter(from), getCenter(from + 1)).closestPointTo(new _private.Point2D(x - divOffset.x, y - divOffset.y));
                    }

                    var edgeDragMove = function(dx, dy, x, y) {
                        var line = new _private.Line(vanishingPoint, new _private.Point2D(movementPoint.x + dx, movementPoint.y + dy));
                        var newPoint1 = otherLine1.findIntersectWithLine(line);
                        var newPoint2 = otherLine2.findIntersectWithLine(line);

                        var tmpPositions = [
                            self.centers[0],
                            self.centers[1],
                            self.centers[2],
                            self.centers[3]
                        ];
                        tmpPositions[from] = newPoint1;
                        tmpPositions[(from + 1) % tmpPositions.length] = newPoint2;
                        if (isPolygonConcave(tmpPositions)) {
                            return;
                        }

                        getCenter(from).setTo(newPoint1);
                        getCenter(from + 1).setTo(newPoint2);
                        updateCircles();
                        updatePaths();
                        updateFillerPath();
                        anchorSystem.update();
                        grid.update();
                        measurementsUI.update(self.centers);
                    }

                    var edgeDragEnd = function(event) {
                        dragging = false;
                        _private.isDragging = false;
                        path.attr('stroke', _private.PerspectiveToolSettings.planeEdge.stroke);
                    }

                    var edgeHoverIn = function() {
                        // finding the slope of bisector to display the appropriate cursor direction
                        var direction1 = getCenter(from + 3).clone().subtract(getCenter(from)).normalize();
                        var direction2 = getCenter(from + 2).clone().subtract(getCenter(from + 1)).normalize();
                        var angleBisectorDirection = direction1.clone().add(direction2).divideBy(2);
                        var angleBisectorLine = new _private.Line(new _private.Point2D(0, 0), angleBisectorDirection.clone());
                        setCursor(getCursorStyleForSlope(angleBisectorLine.getSlope()));
                        path.attr('stroke', _private.PerspectiveToolSettings.planeEdge.strokeHoverIn);
                    }

                    var edgeHoverOut = function() {
                        setCursor('auto');
                        if (!dragging) {
                            path.attr('stroke', _private.PerspectiveToolSettings.planeEdge.stroke);
                        }
                    }

                    path.hover(edgeHoverIn, edgeHoverOut);
                    path.drag(edgeDragMove, edgeDragStart, edgeDragEnd);
                })(from, path);

                path.attr('stroke', _private.PerspectiveToolSettings.planeEdge.stroke);
                path.attr('stroke-width', _private.PerspectiveToolSettings.planeEdge.strokeWidth);
                path.attr('stroke-opacity', _private.PerspectiveToolSettings.planeEdge.strokeOpacity);
                path.attr('stroke-linecap', _private.PerspectiveToolSettings.planeEdge.strokeLinecap);

                planeEdgeSet.push(path);

                var pathObj = {
                    path: path,
                    circle1: circles[from],
                    circle2: circles[to],
                };

                circles[from].path1 = pathObj;
                circles[to].path2 = pathObj;

                paths.push(pathObj);
            }

            var lastMousePos;
            var start = function(x, y) {
                _private.isDragging = true;
                plane = new _private.Plane(self.centers[0].clone(), self.centers[1].clone(), self.centers[2].clone(), self.centers[3].clone(), 300, 300);
                uv = plane.screenToUV(x - divOffset.x, y - divOffset.y);
                lastU = uv.x;
                lastV = uv.y;
                lastMousePos = new _private.Point2D(x, y);
            }

            var end = function() {
                _private.isDragging = false;
            }

            var move = function(dx, dy, x, y) {
                if (!screenSpaceMovement) {
                    uv = plane.screenToUV(x - divOffset.x, y - divOffset.y);

                    var offsetU = uv.x - lastU;
                    var offsetV = uv.y - lastV;
                    // Convert back to screen space
                    var tmpPA = plane.uvToScreen(offsetU, offsetV);
                    var tmpPB = plane.uvToScreen(offsetU, offsetV + plane.uvHeight);
                    var tmpPC = plane.uvToScreen(offsetU + plane.uvWidth, offsetV + plane.uvHeight);
                    var tmpPD = plane.uvToScreen(offsetU + plane.uvWidth, offsetV);

                    if (perspectivePointsAreInvalid(tmpPA, tmpPB, tmpPC, tmpPD)) {
                        return;
                    }

                    self.centers[0].setTo(tmpPA);
                    self.centers[1].setTo(tmpPB);
                    self.centers[2].setTo(tmpPC);
                    self.centers[3].setTo(tmpPD);
                } else {
                    var screenMovement = new _private.Point2D(x - lastMousePos.x, y - lastMousePos.y);

                    self.centers[0].add(screenMovement);
                    self.centers[1].add(screenMovement);
                    self.centers[2].add(screenMovement);
                    self.centers[3].add(screenMovement);

                    plane = new _private.Plane(self.centers[0].clone(), self.centers[1].clone(), self.centers[2].clone(), self.centers[3].clone(), 300, 300);
                }

                updateCircles();
                updatePaths();
                updateFillerPath();
                anchorSystem.update();
                grid.update();
                measurementsUI.update(self.centers);
                lastMousePos.setTo(new _private.Point2D(x, y));
            }

            var hoverIn = function() {
                setCursor('move');
            }


            var hoverOut = function() {
                setCursor('default');
            }

            var pathString = getClosedPathString();
            fillerPath = paper.path(pathString);
            fillerPath.attr('fill', _private.PerspectiveToolSettings.fillerPath.fill);
            fillerPath.attr('stroke', _private.PerspectiveToolSettings.fillerPath.stroke);
            fillerPath.attr('opacity', _private.PerspectiveToolSettings.fillerPath.opacity);
            fillerPath.attr('stroke-opacity', _private.PerspectiveToolSettings.fillerPath.strokeOpacity);
            fillerPath.drag(move, start, end);
            fillerPath.hover(hoverIn, hoverOut);
            fillerSet.push(fillerPath);

            // setup measurmentsUI to show textual measurements
            measurementsUI = new _private.MeasurementsUI(this.centers, this, paper);

            anchorSystem = new _private.AnchorSystem([0, divSize.x, 0, divSize.y], circles, this, paper);
            anchorSystem.addAnchorHandlesToSet(anchorHandleSet);
            anchorSystem.addAnchorLinesToSet(nonInteractableSet);

            grid = new _private.Grid(this.centers[0], this.centers[1], this.centers[2], this.centers[3], this.widthFeet, this.heightFeet, paper);


            // nonInteractableSet.insertAfter(backgroundSet);
            fillerSet.insertAfter(nonInteractableSet);
            planeEdgeSet.insertAfter(fillerSet);
            planeVertexSet.insertAfter(planeEdgeSet);
            anchorHandleSet.insertAfter(planeVertexSet);
        }

        function ToOriginalSize(point, scale, offset) {
            return point.clone().divideBy(scale).subtract(offset);
        }

        this.getPoints = function() {
            return [
                ToOriginalSize(this.centers[0], this.scale, this.offset),
                ToOriginalSize(this.centers[1], this.scale, this.offset),
                ToOriginalSize(this.centers[2], this.scale, this.offset),
                ToOriginalSize(this.centers[3], this.scale, this.offset)
            ];
        }


        this.setPoints = function(points) {
            var p1 = new _private.Point2D(points[0].x, points[0].y),
                p2 = new _private.Point2D(points[1].x, points[1].y),
                p3 = new _private.Point2D(points[2].x, points[2].y),
                p4 = new _private.Point2D(points[3].x, points[3].y);

            this.centers[0].setTo(p1).add(this.offset).multiplyBy(this.scale);
            this.centers[1].setTo(p2).add(this.offset).multiplyBy(this.scale);
            this.centers[2].setTo(p3).add(this.offset).multiplyBy(this.scale);
            this.centers[3].setTo(p4).add(this.offset).multiplyBy(this.scale);
            this.update();
        }

        this.scale = 1;
        this.setScale = function(scale) {

            for (var i = 0; i < this.centers.length; i++) {
                this.centers[i].multiplyBy(scale / this.scale);
            }
            this.scale = scale;
            this.update();
        }

        this.offset = new _private.Point2D(0, 0);
        this.translate = function(offset) {
            this.offset.add({
                x: offset.x / this.scale,
                y: offset.y / this.scale
            });
            for (var i = 0; i < this.centers.length; i++) {
                this.centers[i].add(offset);
            }
            this.update();
        }

        this.update = function() {
            updateCircles();
            updatePaths();
            updateFillerPath();
            anchorSystem.update();
            grid.update();
            measurementsUI.update(this.centers);
        }
    }

    return pTool;

})(pTool || {});
