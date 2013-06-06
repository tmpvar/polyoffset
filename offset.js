var Polygon = require('polygon.clip');
var Vec2 = require('vec2');
var segseg = require('segseg');
var PI = Math.PI;
var TAU = PI*2;
var toTAU = function(rads) {
  if (rads<0) {
    rads += TAU;
  }

  return rads;
};

var isect = function(a, b, c, d) {
  var i = segseg(a,b,c,d);
  if (i && i!==true) {
    i = Vec2.fromArray(i);
    if (
      !i.equal(a) &&
      !i.equal(b) &&
      !i.equal(c) &&
      !i.equal(d)
    )
    {
      i.intersection = true;
      return i;
    }
  }
};

module.exports = function(poly, delta, cornerFn) {

  var ret = [],
      last = null,
      bisectors = [],
      orig = Polygon(poly).clean().rewind(true);

  // Compute bisectors
  orig.each(function(prev, current, next, idx) {
    var e1 = current.subtract(prev, true).normalize();
    var e2 = current.subtract(next, true).normalize();
    var length = delta / Math.sin(Math.acos(e1.dot(e2))/2);

    if (delta > 0) {
      length = -length;
    }

    var cornerAngle = toTAU(current.subtract(prev, true).angleTo(next.subtract(current, true)));
    var angleToCorner = toTAU(current.subtract(prev, true).angleTo(Vec2(1, 0)));
    var bisector = Vec2(length, 0).rotate(TAU/4 + cornerAngle/2 - angleToCorner);

    if ((delta < 0 && cornerAngle - TAU/2 < 0) ||
        (delta > 0 && cornerAngle - TAU/2 > 0))
    {
      bisector.add(current);
    } else {
      bisector = current.subtract(bisector, true);
    }
    bisector.cornerAngle = cornerAngle;
    current.bisector = bisector;
    bisector.point = current;
    ret.push(bisector);
  });

  // Identify bisector intersections and collect edges
  var out = [];
  Polygon(ret).each(function(prev, current, next) {
    var i = isect(prev, prev.point, current, current.point);
    if (i) {
      i.intersection = true;
      i.prev = prev;
      i.next = current;
      prev.next = i;
      current.prev = i;
      out.push(i);
    } else {
      prev.next = current;
      current.prev = prev;
    }
    out.push(current);
  });

  return [out];
};
