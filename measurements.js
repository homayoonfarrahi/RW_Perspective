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
    heightLabel.attr('x', textPos.x);
    heightLabel.attr('y', textPos.y);
    var direction = new Line(vertices[0], vertices[1]);
    var angle = direction.getAngle();
    heightLabel.transform('r' + angle + 't0,' + posOffset);
    heightLabel.attr('text', this.perspectiveTool.widthFeet + " '");

    textPos = vertices[1].clone().add(vertices[2]).divideBy(2);
    slope = new Line(vertices[1], vertices[2]).getSlope();
    posOffset = 15;
    widthLabel.attr('x', textPos.x);
    widthLabel.attr('y', textPos.y);
    direction = new Line(vertices[1], vertices[2]);
    angle = direction.getAngle();
    widthLabel.transform('r' + angle + 't0,' + posOffset);
    widthLabel.attr('text', this.perspectiveTool.heightFeet + " '");

    textPos = vertices[3].clone().add(vertices[0]).divideBy(2);
    slope = new Line(vertices[3], vertices[0]).getSlope();
    posOffset = -15;
    upsideLabel.attr('x', textPos.x);
    upsideLabel.attr('y', textPos.y);
    direction = new Line(vertices[3], vertices[0]);
    angle = direction.getAngle();
    upsideLabel.transform('r' + angle + 't0,' + posOffset);
  }

  this.init();
  this.update(vertices);
}
