var fs = require('fs');
var path = require('path');
var uglify = require('uglify-js');

var files = [
    "perspectiveToolSettings.js",
    "points.js",
    "line.js",
    "plane.js",
    "anchorLine.js",
    "anchorPoint.js",
    "anchorSystem.js",
    "grid.js",
    "measurements.js",
    "perspectiveTool.js",
];

var code = {};
files.forEach(function(file) {
    code[file] = fs.readFileSync(path.join(__dirname, file), "utf8");
});

var minified = uglify.minify(code, {
    sourceMap: {
        includeSources: true,
        url: 'perspective-tool.min.js.map'
    }
});

if (minified.error) throw minified.error;

if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'));
}

fs.writeFileSync(path.join(__dirname, 'dist/perspective-tool.min.js'), minified.code);
fs.writeFileSync(path.join(__dirname, 'dist/perspective-tool.min.js.map'), minified.map);
