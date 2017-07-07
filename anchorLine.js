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

    _private.AnchorLine = function(circle1, circle2, anchorSystem) {
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
            var p1 = new _private.Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
            var p2 = new _private.Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
            if (this.anchorSystem.isInsideBoundaries(new _private.Point2D(this.anchorSystem.minX, new _private.Line(p1, p2).getYforX(this.anchorSystem.minX)))) {
                anchors.push(new _private.Point2D(this.anchorSystem.minX, new _private.Line(p1, p2).getYforX(this.anchorSystem.minX)));
            }

            if (this.anchorSystem.isInsideBoundaries(new _private.Point2D(this.anchorSystem.maxX, new _private.Line(p1, p2).getYforX(this.anchorSystem.maxX)))) {
                anchors.push(new _private.Point2D(this.anchorSystem.maxX, new _private.Line(p1, p2).getYforX(this.anchorSystem.maxX)));
            }

            if (this.anchorSystem.isInsideBoundaries(new _private.Point2D(new _private.Line(p1, p2).getXforY(this.anchorSystem.minY), this.anchorSystem.minY))) {
                anchors.push(new _private.Point2D(new _private.Line(p1, p2).getXforY(this.anchorSystem.minY), this.anchorSystem.minY));
            }

            if (this.anchorSystem.isInsideBoundaries(new _private.Point2D(new _private.Line(p1, p2).getXforY(this.anchorSystem.maxY), this.anchorSystem.maxY))) {
                anchors.push(new _private.Point2D(new _private.Line(p1, p2).getXforY(this.anchorSystem.maxY), this.anchorSystem.maxY));
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
            var p1 = new _private.Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
            var p2 = new _private.Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));

            return new _private.Line(p1, p2);
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
            var p1 = new _private.Point2D(this.circle1.circle.attr('cx'), this.circle1.circle.attr('cy'));
            var p2 = new _private.Point2D(this.circle2.circle.attr('cx'), this.circle2.circle.attr('cy'));
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
            this.path1wide.attr('stroke', _private.PerspectiveToolSettings.anchorLine.widePath.stroke);
            this.path1narrow.attr('stroke', _private.PerspectiveToolSettings.anchorLine.narrowPath.stroke);
            this.path2wide.attr('stroke', _private.PerspectiveToolSettings.anchorLine.widePath.stroke);
            this.path2narrow.attr('stroke', _private.PerspectiveToolSettings.anchorLine.narrowPath.stroke);
            this.middlePath.attr('stroke', _private.PerspectiveToolSettings.anchorLine.middlePath.stroke);
            this.path1wide.attr('stroke-width', _private.PerspectiveToolSettings.anchorLine.widePath.strokeWidth);
            this.path1narrow.attr('stroke-width', _private.PerspectiveToolSettings.anchorLine.narrowPath.strokeWidth);
            this.path2wide.attr('stroke-width', _private.PerspectiveToolSettings.anchorLine.widePath.strokeWidth);
            this.path2narrow.attr('stroke-width', _private.PerspectiveToolSettings.anchorLine.narrowPath.strokeWidth);
            this.middlePath.attr('stroke-width', _private.PerspectiveToolSettings.anchorLine.middlePath.strokeWidth);
            this.path1wide.attr('stroke-opacity', _private.PerspectiveToolSettings.anchorLine.widePath.strokeOpacity);
            this.path1narrow.attr('stroke-opacity', _private.PerspectiveToolSettings.anchorLine.narrowPath.strokeOpacity);
            this.path2wide.attr('stroke-opacity', _private.PerspectiveToolSettings.anchorLine.widePath.strokeOpacity);
            this.path2narrow.attr('stroke-opacity', _private.PerspectiveToolSettings.anchorLine.narrowPath.strokeOpacity);
            this.middlePath.attr('stroke-opacity', _private.PerspectiveToolSettings.anchorLine.middlePath.strokeOpacity);
        }

        // just initialize the anchorPoints, they will be positioned correctly in the update right after
        this.anchorPoint1 = new _private.AnchorPoint(new _private.Point2D(0, 0), this.circle1, this);
        this.anchorPoint2 = new _private.AnchorPoint(new _private.Point2D(0, 0), this.circle2, this);

        this.path1wide = this.paper.path('M0,0L0,0');
        this.path1narrow = this.paper.path('M0,0L0,0');
        this.path2wide = this.paper.path('M0,0L0,0');
        this.path2narrow = this.paper.path('M0,0L0,0');
        this.middlePath = this.paper.path('M0,0L0,0');
        this.initPathStyles();

        this.update();
    }

    return pTool;

})(pTool || {});
