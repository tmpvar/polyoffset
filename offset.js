var edgeNormal = require('./edgeNormal');
var Vec2 = require('vec2');
var segseg = require('segseg');
var Polygon = require('polygon');

module.exports = function(poly, delta) {
  var ret = [], lines = [];
  var polygon = new Polygon(poly);
  polygon.each(function(prev, current, next, polyIndex) {
    var normal = edgeNormal(current, next, delta);
    var center = next.add(current, true).divide(2)
    var length = next.subtract(current, true).length();
    var rotated = normal.normalize(true).skew().multiply((delta < 0) ? length : length*length);

    if (delta < 0 && false) {
      lines.push([
        normal.add(center, true).subtract(rotated),
        normal.add(center, true).add(rotated)
      ]);
    } else {
      lines.push([
        normal.add(current, true).subtract(rotated),
        normal.add(next, true).add(rotated)
      ]);
    }
  });

  lines.forEach(function(line, idx) {
    if (delta < 0) {
      lines.forEach(function(inner) {
        if (inner === line) { return; }
        var i = segseg(line[0], line[1], inner[0], inner[1]);
        if (i && i!== true) {
          var vec = Vec2.fromArray(i);
          vec.idx = idx;
          ret.push(vec);
        }
      });
    } else {
      var prev = (idx === 0) ? lines[lines.length-1] : lines[idx-1];

      var i = segseg(line[0], line[1], prev[0], prev[1]);
      i && i!==true && ret.push(Vec2.fromArray(i));
    }
  });

  var seen = {};
  ret = ret.filter(function(a, idx) {
    var key = a.toArray().join(';');
    if (seen[key]) {
      return false;
    } else {
      seen[key] = true;
    }
    var closest = polygon.closestPointTo(a);
    if (a.distance(closest)+.0000001 < Math.abs(delta)) {
      return false;
    }
    return true;
  });

  ret = ret.sort(function(a, b) {
    return b.idx - a.idx;
  }).reverse();

  return ret;
};
