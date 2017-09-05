/**
  This class is responsible for showing textual information on a
  perspective plane.

  It uses raphael to show a plane's height, width, and its up direction
  label.

  When updated, it calculates the new positions and angles for these UI
  elements and updates their transforms accordingly.
*/

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

    _private.MeasurementsUI = function(vertices, perspectiveTool, paper) {
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
            heightLabel.attr('text', getFtIn(this.perspectiveTool.heightFeet));

            widthLabel = paper.text(0.0, 0.0, '1.0');
            widthLabel.attr('fill', '#ff3');
            widthLabel.attr('font-size', 13);
            widthLabel.attr('text', getFtIn(this.perspectiveTool.widthFeet));

            upsideLabel = paper.text(0.0, 0.0, 'This End UP');
            upsideLabel.attr('fill', '#ff3');
            upsideLabel.attr('font-size', 13);
        }

        this.update = function(vertices) {
            var textPos = vertices[0].clone().add(vertices[1]).divideBy(2);
            var slope = new Geometry.Line(vertices[0], vertices[1]).getSlope();
            var posOffset = -15;
            if (slope === undefined || slope >= 0) {
                posOffset *= -1;
            }
            var direction = new Geometry.Line(vertices[0], vertices[1]);
            var angle = direction.getAngle();
            heightLabel.transform('t' + textPos.x + ',' + textPos.y + 'r' + angle + 't0,' + posOffset);

            textPos = vertices[1].clone().add(vertices[2]).divideBy(2);
            slope = new Geometry.Line(vertices[1], vertices[2]).getSlope();
            posOffset = 15;
            direction = new Geometry.Line(vertices[1], vertices[2]);
            angle = direction.getAngle();
            widthLabel.transform('t' + textPos.x + ',' + textPos.y + 'r' + angle + 't0,' + posOffset);

            textPos = vertices[3].clone().add(vertices[0]).divideBy(2);
            slope = new Geometry.Line(vertices[3], vertices[0]).getSlope();
            posOffset = -15;
            direction = new Geometry.Line(vertices[3], vertices[0]);
            angle = direction.getAngle();
            upsideLabel.transform('t' + textPos.x + ',' + textPos.y + 'r' + angle + 't0,' + posOffset);
        }

        this.updateDimensions = function() {
            heightLabel.attr('text', getFtIn(this.perspectiveTool.heightFeet));
            widthLabel.attr('text', getFtIn(this.perspectiveTool.widthFeet));
        }

        // Converts decimal ft to proper inches ex) 3.5 => 3'6"
        var getFtIn = function(ft) {
            return parseInt(ft) + '\'' + Math.round((ft % 1) * 12) + '"';
        }

        this.init();
        this.update(vertices);
    }


    return pTool;

})(pTool || {});
