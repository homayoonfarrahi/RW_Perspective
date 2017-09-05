# Perspective Tool #
This tool allows users to set the perspectives and masks for different parts of the image. Compared to previous tools, it increases the accuracy and efficiency of this task by introducing new features like anchor points, perspective in-plane movement and rotation. It is written in Javascript and uses Raphael for the graphic elements.

## Getting Started ##
Clone the repository and open `index.html` in a browser. You can play around with the tool and learn all the features. Open `index.html` in a code editor. This file is an example that shows how easy it is to integrate this tool within any webpage. Include all the JS files or only the minified version in your html.

This tool does not handle the actual images and only draws its graphic elements on top of an html element. You are responsible for putting the image in the page, specifying an *id* for that element and passing the *id* as a parameter to the `PerspectiveManager` when initializing.

The tool can be initialized using the following line:

```javascript
PerspectiveManager.init($('#*div_id*')[0], width, height);
```

where *div_id* is the id of the element that has the picture, and *width* and *height* are the width and height of the image inside that element. This will create a default perspective plane and return the reference. Furthermore, Additional perspective planes can be created by calling

```javascript
PerspectiveManager.createPerspective();
```

which also returns the reference to the newly created perspective plane.

## Usage ##
The returned references to the perspective planes can be used to get or set information on the perspective plane. Some functions of notable importance include:
* `perspectiveTool.setDimensions(width_feet, height_feet);`
Which can be used to set the dimensions of the perspective plane in feet.

* `perspectiveTool.getPoints();`
Which can be used to obtain the coordinates of the four points of the perspective plane once the user is done setting the perspective.j

For a complete list of available functions refer to the file `perspectiveTool.js`.

Some properties of the graphic elements of the tool can be set in `perspectiveToolSettings.js`.

## Dependencies ##
* jQuery - jquery.org
* mathjs - github.com/josdejong/mathjs
* Raphaël - github.com/DmitryBaranovskiy/raphael/
* UglifyJS - github.com/mishoo/UglifyJS2
