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
