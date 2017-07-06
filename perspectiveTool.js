(function($) {
    Renoworks = window.Renoworks || {};
    Renoworks.PerspectiveTool = new PerspectiveTool();

    function PerspectiveTool() {
        this.centers = [
            new Point2D(256, 498),
            new Point2D(255, 673),
            new Point2D(486, 607),
            new Point2D(445, 455)
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
        var isDragging = false;

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
            return isDragging;
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

                divOffset = new Point2D(divOffsetX, divOffsetY);
                divSize = new Point2D(widthFeet, heightFeet);

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
                circle.attr('fill', PerspectiveToolSettings.planeVertex.fillIdle);
                circle.attr('opacity', PerspectiveToolSettings.planeVertex.opacity);

                (function(i, circle) {
                    var initialCirclePos = undefined;

                    var circleDragMove = function(dx, dy, x, y, event) {
                        var i = 0;
                        for (i = 0; i < circles.length; i++) {
                            if (circles[i].circle === circle) break;
                        }

                        var newPos = initialCirclePos.clone().add(new Point2D(dx, dy));
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
                        isDragging = true;
                        initialCirclePos = new Point2D(circle.attr('cx'), circle.attr('cy'));
                    }

                    var circleDragEnd = function(event) {
                        isDragging = false;
                    }

                    var circleHoverIn = function() {
                        circle.attr('fill', PerspectiveToolSettings.planeVertex.fillHoverIn);
                        setCursor('move');
                    }

                    var circleHoverOut = function() {
                        circle.attr('fill', PerspectiveToolSettings.planeVertex.fillIdle);
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
                        isDragging = true;
                        dragging = true;
                        otherLine1 = new Line(getCenter(from), getCenter(from + 3));
                        otherLine2 = new Line(getCenter(from + 1), getCenter(from + 2));
                        vanishingPoint = new Line(getCenter(from), getCenter(from + 1)).findIntersectWithLine(new Line(getCenter(from + 2), getCenter(from + 3)));
                        movementPoint = new Line(getCenter(from), getCenter(from + 1)).closestPointTo(new Point2D(x - divOffset.x, y - divOffset.y));
                    }

                    var edgeDragMove = function(dx, dy, x, y) {
                        var line = new Line(vanishingPoint, new Point2D(movementPoint.x + dx, movementPoint.y + dy));
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
                        isDragging = false;
                        path.attr('stroke', PerspectiveToolSettings.planeEdge.stroke);
                    }

                    var edgeHoverIn = function() {
                        // finding the slope of bisector to display the appropriate cursor direction
                        var direction1 = getCenter(from + 3).clone().subtract(getCenter(from)).normalize();
                        var direction2 = getCenter(from + 2).clone().subtract(getCenter(from + 1)).normalize();
                        var angleBisectorDirection = direction1.clone().add(direction2).divideBy(2);
                        var angleBisectorLine = new Line(new Point2D(0, 0), angleBisectorDirection.clone());
                        setCursor(getCursorStyleForSlope(angleBisectorLine.getSlope()));
                        path.attr('stroke', PerspectiveToolSettings.planeEdge.strokeHoverIn);
                    }

                    var edgeHoverOut = function() {
                        setCursor('auto');
                        if (!dragging) {
                            path.attr('stroke', PerspectiveToolSettings.planeEdge.stroke);
                        }
                    }

                    path.hover(edgeHoverIn, edgeHoverOut);
                    path.drag(edgeDragMove, edgeDragStart, edgeDragEnd);
                })(from, path);

                path.attr('stroke', PerspectiveToolSettings.planeEdge.stroke);
                path.attr('stroke-width', PerspectiveToolSettings.planeEdge.strokeWidth);
                path.attr('stroke-opacity', PerspectiveToolSettings.planeEdge.strokeOpacity);
                path.attr('stroke-linecap', PerspectiveToolSettings.planeEdge.strokeLinecap);

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
                isDragging = true;
                plane = new Plane(self.centers[0].clone(), self.centers[1].clone(), self.centers[2].clone(), self.centers[3].clone(), 300, 300);
                uv = plane.screenToUV(x - divOffset.x, y - divOffset.y);
                lastU = uv.x;
                lastV = uv.y;
                lastMousePos = new Point2D(x, y);
            }

            var end = function() {
                isDragging = false;
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
                    var screenMovement = new Point2D(x - lastMousePos.x, y - lastMousePos.y);

                    self.centers[0].add(screenMovement);
                    self.centers[1].add(screenMovement);
                    self.centers[2].add(screenMovement);
                    self.centers[3].add(screenMovement);

                    plane = new Plane(self.centers[0].clone(), self.centers[1].clone(), self.centers[2].clone(), self.centers[3].clone(), 300, 300);
                }

                updateCircles();
                updatePaths();
                updateFillerPath();
                anchorSystem.update();
                grid.update();
                measurementsUI.update(self.centers);
                lastMousePos.setTo(new Point2D(x, y));
            }

            var hoverIn = function() {
                setCursor('move');
            }


            var hoverOut = function() {
                setCursor('default');
            }

            var pathString = getClosedPathString();
            fillerPath = paper.path(pathString);
            fillerPath.attr('fill', PerspectiveToolSettings.fillerPath.fill);
            fillerPath.attr('stroke', PerspectiveToolSettings.fillerPath.stroke);
            fillerPath.attr('opacity', PerspectiveToolSettings.fillerPath.opacity);
            fillerPath.attr('stroke-opacity', PerspectiveToolSettings.fillerPath.strokeOpacity);
            fillerPath.drag(move, start, end);
            fillerPath.hover(hoverIn, hoverOut);
            fillerSet.push(fillerPath);

            // setup measurmentsUI to show textual measurements
            measurementsUI = new MeasurementsUI(this.centers, this, paper);

            anchorSystem = new AnchorSystem([0, divSize.x, 0, divSize.y], circles, this, paper);
            anchorSystem.addAnchorHandlesToSet(anchorHandleSet);
            anchorSystem.addAnchorLinesToSet(nonInteractableSet);

            grid = new Grid(this.centers[0], this.centers[1], this.centers[2], this.centers[3], this.widthFeet, this.heightFeet, paper);


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
            var p1 = new Point2D(points[0].x, points[0].y),
                p2 = new Point2D(points[1].x, points[1].y),
                p3 = new Point2D(points[2].x, points[2].y),
                p4 = new Point2D(points[3].x, points[3].y);

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

        this.offset = new Point2D(0, 0);
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


    function AnchorSystem(boundaries, circles, perspectiveTool, paper) {
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
            Renoworks.PerspectiveTool.getPaper().canvas.style.cursor = cursor;
        }

        this.addAnchorLine = function(circle1, circle2) {
            var anchorLine = new AnchorLine(circle1, circle2, this);
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

    function AnchorLine(circle1, circle2, anchorSystem) {
        this.circle1 = circle1;
        this.circle2 = circle2;
        this.anchorPoint1 = null;
        this.anchorPoint2 = null;
        this.path1wide = null;
        this.path1narrow = null;
        this.path2wide = null;
        this.path2narrow = null;
        this.middlePath = null;
        this.anchorSystem = anchorSystem;
        this.perspectiveTool = anchorSystem.perspectiveTool;
        this.paper = anchorSystem.paper;

        this.computeAnchorPositions = function() {
            var anchors = [];
            var p1 = new Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
            var p2 = new Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
            if (this.anchorSystem.isInsideBoundaries(new Point2D(this.anchorSystem.minX, new Line(p1, p2).getYforX(this.anchorSystem.minX)))) {
                anchors.push(new Point2D(this.anchorSystem.minX, new Line(p1, p2).getYforX(this.anchorSystem.minX)));
            }

            if (this.anchorSystem.isInsideBoundaries(new Point2D(this.anchorSystem.maxX, new Line(p1, p2).getYforX(this.anchorSystem.maxX)))) {
                anchors.push(new Point2D(this.anchorSystem.maxX, new Line(p1, p2).getYforX(this.anchorSystem.maxX)));
            }

            if (this.anchorSystem.isInsideBoundaries(new Point2D(new Line(p1, p2).getXforY(this.anchorSystem.minY), this.anchorSystem.minY))) {
                anchors.push(new Point2D(new Line(p1, p2).getXforY(this.anchorSystem.minY), this.anchorSystem.minY));
            }

            if (this.anchorSystem.isInsideBoundaries(new Point2D(new Line(p1, p2).getXforY(this.anchorSystem.maxY), this.anchorSystem.maxY))) {
                anchors.push(new Point2D(new Line(p1, p2).getXforY(this.anchorSystem.maxY), this.anchorSystem.maxY));
            }

            // remove duplicate anchor points
            if (anchors.length !== 2 && anchors.length !== 0) {
                for (var i = 0; i < anchors.length; i++) {
                    for (var j = i + 1; j < anchors.length; j++) {
                        if (anchors[i].x === anchors[j].x && anchors[i].y === anchors[j].y) {
                            anchors.splice(j, 1);
                            j = i + 1;
                        }
                    }
                }
            }

            if (anchors.length !== 2 && anchors.length !== 0) {
                console.error('only 0 or 2 anchors are accepted, not ' + anchors.length);
            }

            return anchors;
        }

        this.setPaperInstance = function(paper) {
            this.paper = paper;
        }

        this.getCircleOppositeToAnchorPoint = function(anchorPoint) {
            if (anchorPoint === this.anchorPoint1) {
                return this.circle2;
            } else if (anchorPoint === this.anchorPoint2) {
                return this.circle1;
            }

            console.error('The given anchor point should be one of the points of this anchor line');
        }

        this.getLine = function() {
            var p1 = new Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
            var p2 = new Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));

            return new Line(p1, p2);
        }

        this.setupExtendedPaths = function(widePath, narrowPath, p1, p2) {
            var pathString = 'M' + p1.x + ',' + p1.y;
            pathString += 'L' + p2.x + ',' + p2.y;
            widePath.attr('path', pathString);
            narrowPath.attr('path', pathString);

            widePath.show();
            narrowPath.show();
        }

        this.addAnchorHandlesToSet = function(set) {
            this.anchorPoint1.addAnchorHandlesToSet(set);
            this.anchorPoint2.addAnchorHandlesToSet(set);
        }

        this.addAnchorLinesToSet = function(set) {
            set.push(this.path1wide);
            set.push(this.path1narrow);
            set.push(this.path2wide);
            set.push(this.path2narrow);
            set.push(this.middlePath);
        }

        this.update = function() {
            var p1 = new Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
            var p2 = new Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
            var anchors = this.computeAnchorPositions();
            if (anchors.length !== 0) {
                var deltaP = p2.clone().subtract(p1);
                var deltaAnchor = anchors[1].clone().subtract(anchors[0]);
                if ((deltaP.x * deltaAnchor.x >= 0) && (deltaP.y * deltaAnchor.y >= 0)) {
                    this.anchorPoint1.setPosition(anchors[0]);
                    this.anchorPoint2.setPosition(anchors[1]);
                } else {
                    this.anchorPoint1.setPosition(anchors[1]);
                    this.anchorPoint2.setPosition(anchors[0]);
                }

                this.setupExtendedPaths(this.path1wide, this.path1narrow, this.anchorPoint1.position, this.circle1.point);
                this.setupExtendedPaths(this.path2wide, this.path2narrow, this.anchorPoint2.position, this.circle2.point);

                var pathString = 'M' + this.circle1.point.x + ',' + this.circle1.point.y;
                pathString += 'L' + this.circle2.point.x + ',' + this.circle2.point.y;
                this.middlePath.attr('path', pathString);
                this.middlePath.show();
            } else {
                this.path1wide.hide();
                this.path1narrow.hide();
                this.path2wide.hide();
                this.path2narrow.hide();
                this.middlePath.hide();
            }

            this.anchorPoint1.update();
            this.anchorPoint2.update();
        }

        this.initPathStyles = function() {
            this.path1wide.attr('stroke', PerspectiveToolSettings.anchorLine.widePath.stroke);
            this.path1narrow.attr('stroke', PerspectiveToolSettings.anchorLine.narrowPath.stroke);
            this.path2wide.attr('stroke', PerspectiveToolSettings.anchorLine.widePath.stroke);
            this.path2narrow.attr('stroke', PerspectiveToolSettings.anchorLine.narrowPath.stroke);
            this.middlePath.attr('stroke', PerspectiveToolSettings.anchorLine.middlePath.stroke);
            this.path1wide.attr('stroke-width', PerspectiveToolSettings.anchorLine.widePath.strokeWidth);
            this.path1narrow.attr('stroke-width', PerspectiveToolSettings.anchorLine.narrowPath.strokeWidth);
            this.path2wide.attr('stroke-width', PerspectiveToolSettings.anchorLine.widePath.strokeWidth);
            this.path2narrow.attr('stroke-width', PerspectiveToolSettings.anchorLine.narrowPath.strokeWidth);
            this.middlePath.attr('stroke-width', PerspectiveToolSettings.anchorLine.middlePath.strokeWidth);
            this.path1wide.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.widePath.strokeOpacity);
            this.path1narrow.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.narrowPath.strokeOpacity);
            this.path2wide.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.widePath.strokeOpacity);
            this.path2narrow.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.narrowPath.strokeOpacity);
            this.middlePath.attr('stroke-opacity', PerspectiveToolSettings.anchorLine.middlePath.strokeOpacity);
        }

        // just initialize the anchorPoints, they will be positioned correctly in the update right after
        this.anchorPoint1 = new AnchorPoint(new Point2D(0, 0), this.circle1, this);
        this.anchorPoint2 = new AnchorPoint(new Point2D(0, 0), this.circle2, this);

        this.path1wide = this.paper.path('M0,0L0,0');
        this.path1narrow = this.paper.path('M0,0L0,0');
        this.path2wide = this.paper.path('M0,0L0,0');
        this.path2narrow = this.paper.path('M0,0L0,0');
        this.middlePath = this.paper.path('M0,0L0,0');
        this.initPathStyles();

        this.update();
    }

    function AnchorPoint(point, circle, anchorLine) {
        this.associatedCircle = circle;
        this.position = point;
        this.anchorLine = anchorLine;
        this.perspectiveTool = anchorLine.perspectiveTool;
        this.paper = anchorLine.paper;

        this.handle = this.paper.circle(this.position.x, this.position.y, 10);
        this.handle.attr('fill', PerspectiveToolSettings.anchorLine.handle.fillIdle);
        this.handle.attr('opacity', PerspectiveToolSettings.anchorLine.handle.opacity);
        var initialHandlePos = undefined;
        var dragging = false;
        var hoverIn = function() {
            var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);
            if (movementDirection === 'horizontal') {
                setCursor('ew-resize');
            } else if (movementDirection === 'vertical') {
                setCursor('ns-resize');
            }
            this.handle.attr('fill', PerspectiveToolSettings.anchorLine.handle.fillHoverIn);
        }

        var hoverOut = function() {
            setCursor('auto');
            if (!dragging) {
                this.handle.attr('fill', PerspectiveToolSettings.anchorLine.handle.fillIdle);
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

            var p1 = initialHandlePos.clone().add(new Point2D(dx, dy));
            var p2 = new Point2D(oppositeCircle.circle.attr('cx'), oppositeCircle.circle.attr('cy'));
            var intersect = new Line(p1, p2).findIntersectWithLine(movementAnchorLine.getLine());

            var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);

            if (movementDirection == 'horizontal') {
                setCursor('ew-resize');
            } else if (movementDirection == 'vertical') {
                setCursor('ns-resize');
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
            isDragging = true;
            dragging = true;
            initialHandlePos = new Point2D(this.handle.attr('cx'), this.handle.attr('cy'));

            var movementDirection = this.anchorLine.anchorSystem.getMovementDirection(this);
            if (movementDirection === 'horizontal') {
                setCursor('ew-resize');
            } else if (movementDirection === 'vertical') {
                setCursor('ns-resize');
            }
        };

        var dragEnds = function(event) {
            isDragging = false;
            this.handle.attr('fill', PerspectiveToolSettings.anchorLine.handle.fillIdle);
            setCursor('auto');
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
    }

    function Grid(a, b, c, d, abFeet, bcFeet, paper) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.abFeet = abFeet;
        this.bcFeet = bcFeet;
        this.paper = paper;

        this.horizontalPaths = this.paper.set();
        this.verticalPaths = this.paper.set();

        this.plane = undefined;

        this.makeGridLines = function(line1, line2, footSize, pathSet) {
            startPoints = line1.getSegmentPoints(footSize);
            endPoints = line2.getSegmentPoints(footSize);

            if (startPoints.length !== endPoints.length) {
                console.error('Both lines should have been segmented into equal parts, not ' +
                    startPoints.length + ' and ' + endPoints.length);
            }

            for (var i = 0; i < startPoints.length; i++) {
                var startScreenPoint = this.plane.uvToScreen(startPoints[i].x, startPoints[i].y);
                var endScreenPoint = this.plane.uvToScreen(endPoints[i].x, endPoints[i].y);

                var pathString = 'M' + startScreenPoint.x + ',' + startScreenPoint.y;
                pathString += 'L' + endScreenPoint.x + ',' + endScreenPoint.y;

                var path = this.paper.path(pathString);
                pathSet.push(path);
                path.toBack();
            }
        }

        this.removePaths = function(pathSet) {
            for (var i = 0; i < pathSet.length; i++) {
                pathSet[i].remove();
            }
            pathSet.clear();
        }

        this.update = function() {
            this.plane = new Plane(this.a.clone(), this.b.clone(), this.c.clone(), this.d.clone(), 300, 300);
            var aUV = this.plane.screenToUV(this.a.x, this.a.y);
            var bUV = this.plane.screenToUV(this.b.x, this.b.y);
            var cUV = this.plane.screenToUV(this.c.x, this.c.y);
            var dUV = this.plane.screenToUV(this.d.x, this.d.y);

            this.removePaths(this.horizontalPaths);
            this.makeGridLines(new Line(aUV, bUV), new Line(dUV, cUV), this.abFeet, this.horizontalPaths);

            this.removePaths(this.verticalPaths);
            this.makeGridLines(new Line(aUV, dUV), new Line(bUV, cUV), this.bcFeet, this.verticalPaths);
        }

        this.setDimensions = function(wf, hf) {
            this.abFeet = wf;
            this.bcFeet = hf;
            this.update();
        }

        this.update();
    }

    function Line(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;

        this.getYforX = function(givenX) {
            var dx = this.p2.x - this.p1.x;
            var dy = this.p2.y - this.p1.y;

            if (dy === 0) {
                return this.p1.y;
            }

            if (dx === 0) {
                return undefined;
            }

            var slope = dy / dx;
            var yIntercept = this.p1.y - (slope * this.p1.x);

            return (slope * givenX) + yIntercept;
        }

        this.getXforY = function(givenY) {
            var dx = this.p2.x - this.p1.x;
            var dy = this.p2.y - this.p1.y;

            if (dy === 0) {
                return undefined;
            }

            if (dx === 0) {
                return this.p1.x;
            }

            var slope = dy / dx;
            var yIntercept = this.p1.y - (slope * this.p1.x);

            return (givenY - yIntercept) / slope;
        }

        this.findIntersectWithLine = function(line) {
            return Line.findIntersect(this.p1, this.p2, line.p1, line.p2);
        }

        this.getSegmentPoints = function(partCount) {
            var points = [];
            var segmentDirection = this.p2.clone().subtract(this.p1).divideBy(partCount);
            for (var i = 0; i < Math.ceil(partCount) - 1; i++) {
                var segmentPoint = this.p1.clone().add(segmentDirection.clone().multiplyBy(i + 1));
                points.push(segmentPoint);
            }

            return points;
        }

        this.closestPointTo = function(givenPoint) {
            var dx = this.p2.x - this.p1.x;
            var dy = this.p2.y - this.p1.y;

            if (dy === 0) {
                return new Point2D(givenPoint.x, p1.y);
            }

            if (dx === 0) {
                return new Point2D(p1.x, givenPoint.y)
            }

            var slope = dy / dx;
            var perpendicularSlope = -1 / slope;
            var perpendicularLine = new Line(givenPoint, givenPoint.clone().add(new Point2D(1, perpendicularSlope)));
            var closestPoint = this.findIntersectWithLine(perpendicularLine);

            return closestPoint;
        }

        this.getSlope = function() {
            var dx = this.p2.x - this.p1.x;
            var dy = this.p2.y - this.p1.y;

            if (dx === 0) {
                return undefined;
            }

            return dy / dx;
        }

        this.getAngle = function() {
            var slope = this.getSlope();
            if (slope === undefined) {
                return 90;
            }

            return Math.atan(slope) * (180.0 / Math.PI);
        }

        this.getPerpendicularDirection = function() {
            var slope = this.getSlope();
            if (slope === undefined) {
                return new Point2D(-1, 0);
            }

            if (slope === 0) {
                return new Point2D(0, 1);
            }

            var perpendicularSlope = -1 / slope;

        }

        Line.findIntersect = function(a, b, c, d) {
            //finds intersection between line a-b and line c-d
            var a1 = 0,
                a2 = 0,
                b1 = 0,
                b2 = 0,
                c1 = 0,
                c2 = 0,
                m = 0,
                bb = 0;
            var cp = new Point2D(0, 0);
            var ret = new Point2D(0, 0);

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
                cp = Plane.findCenterPoint(a, b, c, d);
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

        Line.length2D = function(a, b) {
            //calculates the distance between two points in 2d space
            return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
        }
    }

    function Plane(screenPointA, screenPointB, screenPointC, screenPointD, uvWidth, uvHeight) {
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
        this.a = new Point3D(0, 0, 0);
        // 3D location of perspective point
        this.b = new Point3D(0, 0, 0);
        // 3D location of perspective point
        this.c = new Point3D(0, 0, 0);
        // 3D location of perspective point
        this.d = new Point3D(0, 0, 0);
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
            this.vh = Line.findIntersect(this.pa, this.pd, this.pb, this.pc);
            //horizontal vanishing point of projected plane
            this.vv = Line.findIntersect(this.pa, this.pb, this.pc, this.pd);
            //vertical vanishing point of projected plane
            this.cp = Line.findIntersect(this.pa, this.pc, this.pb, this.pd);
            //center point of projected plane

            //1b. Compute transverse points (these are the lines that go through a-c & b-d (criss-cross), and intersect the horizon line of .vh-.vv)
            this.tr_ac = Line.findIntersect(this.pa, this.pc, this.vh, this.vv);
            this.tr_bd = Line.findIntersect(this.pb, this.pd, this.vh, this.vv);

            //2. Get length to vanishing points
            avh = Line.length2D(this.pa, this.vh);
            avv = Line.length2D(this.pa, this.vv);
            bvh = Line.length2D(this.pb, this.vh);
            bvv = Line.length2D(this.pb, this.vv);
            cvh = Line.length2D(this.pc, this.vh);
            cvv = Line.length2D(this.pc, this.vv);
            dvh = Line.length2D(this.pd, this.vh);
            dvv = Line.length2D(this.pd, this.vv);

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

        Plane.findCenterPoint = function(a, b, c, d) {
            //finds the center between FOUR points
            //to find the centerpoint between just TWO points (not four), then enter CenterPoint(a, b, a, b)
            var x1, x2, y1, y2;
            var ab, cd;
            ab = new Point2D(0, 0);
            cd = new Point2D(0, 0);

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

            var ret = new Point2D(0, 0);
            ret.x = x1 + (x2 - x1) / 2;
            ret.y = y1 + (y2 - y1) / 2;
            return ret;
        }

        Plane.interpolateTrianglePerspective = function(x1, y1, z1, uv1, x2, y2, z2, uv2, x3, y3, z3, uv3, px, py) {
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
        Plane.interpolateTriangleLinear = function(x1, y1, uv1, x2, y2, uv2, x3, y3, uv3, px, py) {

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


        this.screenToUV = function(px, py) {
            var u = Plane.interpolateTrianglePerspective(
                this.pa.x, this.pa.y, this.a.z, 0,
                this.pb.x, this.pb.y, this.b.z, 0,
                this.pc.x, this.pc.y, this.c.z, this.uvWidth, px, py);
            var v = Plane.interpolateTrianglePerspective(
                this.pa.x, this.pa.y, this.a.z, 0,
                this.pb.x, this.pb.y, this.b.z, this.uvHeight,
                this.pc.x, this.pc.y, this.c.z, this.uvHeight, px, py);
            return new Point2D(u, v);
        };

        this.uvToScreen = function(pu, pv) {
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
            return new Point2D(px, py);
        };

        this.computeZforProjectedPlane();
    }

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

    function Point3D(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.clone2D = function() {
            return new Point2D(this.x, this.y);
        }
    }

    function MeasurementsUI(vertices, perspectiveTool, paper) {
        this.vertices = vertices;
        this.perspectiveTool = perspectiveTool;
        this.paper = paper;

        var widthLabel;
        var heightLabel;
        var upsideLabel;

        this.init = function() {
            heightLabel = paper.text(0.0, 0.0, '1.0');
            heightLabel.attr('fill', '#ff3');
            heightLabel.attr('font-size', 13);
            heightLabel.attr('text', this.perspectiveTool.widthFeet + " '");

            widthLabel = paper.text(0.0, 0.0, '1.0');
            widthLabel.attr('fill', '#ff3');
            widthLabel.attr('font-size', 13);
            widthLabel.attr('text', this.perspectiveTool.heightFeet + " '");

            upsideLabel = paper.text(0.0, 0.0, 'This End UP');
            upsideLabel.attr('fill', '#ff3');
            upsideLabel.attr('font-size', 13);
        }

        this.update = function(vertices) {
            var textPos = vertices[0].clone().add(vertices[1]).divideBy(2);
            var slope = new Line(vertices[0], vertices[1]).getSlope();
            var posOffset = -15;
            if (slope === undefined || slope >= 0) {
                posOffset *= -1;
            }
            var direction = new Line(vertices[0], vertices[1]);
            var angle = direction.getAngle();
            heightLabel.transform('t' + textPos.x + ',' + textPos.y + 'r' + angle + 't0,' + posOffset);

            textPos = vertices[1].clone().add(vertices[2]).divideBy(2);
            slope = new Line(vertices[1], vertices[2]).getSlope();
            posOffset = 15;
            direction = new Line(vertices[1], vertices[2]);
            angle = direction.getAngle();
            widthLabel.transform('t' + textPos.x + ',' + textPos.y + 'r' + angle + 't0,' + posOffset);

            textPos = vertices[3].clone().add(vertices[0]).divideBy(2);
            slope = new Line(vertices[3], vertices[0]).getSlope();
            posOffset = -15;
            direction = new Line(vertices[3], vertices[0]);
            angle = direction.getAngle();
            upsideLabel.transform('t' + textPos.x + ',' + textPos.y + 'r' + angle + 't0,' + posOffset);
        }

        this.updateDimensions = function() {
            heightLabel.attr('text', this.perspectiveTool.widthFeet + " '");
            widthLabel.attr('text', this.perspectiveTool.heightFeet + " '");
        }

        this.init();
        this.update(vertices);
    }

})(jQuery);
