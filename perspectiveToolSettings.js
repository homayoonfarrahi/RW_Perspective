var PerspectiveToolSettings = new function() {
  this.fillerPath = new function() {
    this.fill = '#fff';
    this.stroke = '#fff';
    this.opacity = 0.4;
    this.strokeOpacity = 0.4;
  };

  this.planeVertex = new function() {
    this.fillIdle = '#00f';
    this.fillHoverIn = '#f00';
    this.opacity = 0.5;
  };

  this.planeEdge = new function() {
    this.stroke = '#00f';
    this.strokeHoverIn = '#f00';
    this.strokeWidth = 7;
    this.strokeOpacity = 0.3;
    this.strokeLinecap = 'round';
  };

  this.anchorLine = new function() {
    this.widePath = new function() {
      this.stroke = '#000';
      this.strokeWidth = 3;
      this.strokeOpacity = 0.5;
    };

    this.narrowPath = new function() {
      this.stroke = '#fff';
      this.strokeWidth = 1;
      this.strokeOpacity = 0.7;
    };

    this.middlePath = new function() {
      this.stroke = '#000';
      this.strokeWidth = 1;
      this.strokeOpacity = 1;
    };

    this.handle = new function() {
      this.fillIdle = '#00f';
      this.fillHoverIn = '#f00';
      this.opacity = 0.5;
    };
  };
};
