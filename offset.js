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

    current.bisector = bisector;
    bisector.point = current;
    ret.push(bisector);
  });

  var out = [];
  Polygon(ret).each(function(p, c, n, idx) {


    out.push(c);
    var count = 0;
    do {
      var compare = out[out.length-(count+1)];
      var i = segseg(compare, compare.point, n, n.point);
      if (i && i!==true) {
        count++;
      }

    } while(i && out.length)

    if (count > 1) {
      while(count--) { out.pop() }
    }
  });

  var f = [];
  Polygon(out).rewind(false).each(function(p, c, n, idx) {
    f.push(c);
    var count = 0;
    do {
      var compare = f[f.length-(count+1)];
      var i = segseg(compare, compare.point, n, n.point);
      if (i && i!==true) {
        count++;
      }

    } while(i && f.length)

    if (count > 1) {
      while(count--) { f.pop() }
    }
  });


  out = f;
  f = [];
  var found = false;
  Polygon(out).rewind(false).each(function(p, c, n, idx) {
    f.push(c);
    var count = 0;
    if (!found) {
      do {
        var compare = f[f.length-(count+1)];
        var i = segseg(compare, compare.point, n, n.point);
        if (i && i!==true) {
          f.pop();
          found = true;
        }
      } while(i && f.length)
    }
  });

  out = f;
  f = [];
  found = false;
  Polygon(out).rewind(true).each(function(p, c, n, idx) {
    f.push(c);
    var count = 0;
    if (!found) {
      do {
        var compare = f[f.length-(count+1)];
        var i = segseg(compare, compare.point, n, n.point);
        if (i && i!==true) {
          f.pop();
          found = true;
        }
      } while(i && f.length)
    }
  });


  return [Polygon(f).rewind(true).points];
};