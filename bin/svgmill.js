#!/usr/bin/env node


var reader = require('../svgreader');
var offset = require('../offset');
var argv = require('optimist').argv;


var svg = "";
process.stdin.on('data', function(d) {
  svg+=d;
});


process.stdin.on('end', function() {

  var polys = reader.parse(svg).allcolors;
  var results = [];
  var gcode = ['M4 S6000', 'G4 P2'];
  var zfeed = 200;
  var cutZ = (typeof argv.cutZ !== 'undefined') ? parseFloat(argv.cutZ) : 114;
  var scale = (typeof argv.scale !== 'undefined') ? parseFloat(argv.scale) : 1;
  var feed = 2000;

  function move(coords) {
    var parts = [
      'G1',
    ];

    for (var coord in coords) {
      if (coords.hasOwnProperty(coord)) {
        parts.push(coord.toUpperCase() + coords[coord]);
      }
    }

    gcode.push(parts.join(' '));
  }

  polys.shift();
  polys.shift();

  polys.forEach(function(poly) {
    if (scale !== 1) {
      poly.map(function(a) {
        return a.multiply(scale);
      });
    }


    offset(poly, 2).forEach(function(result) {
      result.forEach(function(coord, idx) {
        move({ x: coord.x, y: coord.y, f: feed });
        if (idx === 0) {
          move({ z: cutZ, f: zfeed });
        }
      });
      move({ x: result[0].x, y: result[1].y, f: feed });
      move({ z: 0, f: zfeed });
    });
  });


  gcode.push('G4 P2');
  gcode.push('M5');
  move({ x: 0, y:0, f: feed });
  console.log(gcode.join('\n'));
});

process.stdin.resume();