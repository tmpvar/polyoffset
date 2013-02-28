var Polygon = require('polygon');
var Vec2 = require('vec2');
var segseg = require('segseg');
var PI2 = Math.PI*2;

module.exports = function(poly, delta, cornerFn) {

  var ret = [],
      last = null,
      orig = Polygon(poly).clean().rewind(true);

  // Default to arcs for corners
  cornerFn = cornerFn || function(current, currentNormal, nextNormal, normal, delta) {

    var rads = .15;

    var angleToCurrentNormal = normal.angleTo(current.subtract(currentNormal, true));
    var angleToNextNormal = normal.angleTo(current.subtract(nextNormal, true));
    var corner = [];

    if (angleToNextNormal < angleToCurrentNormal) {
      angleToNextNormal += Math.PI*2
    }

    var angle = (angleToNextNormal - angleToCurrentNormal);
    if (
        angle < rads ||
        Math.abs(Math.PI*2-angle) < rads ||
        (delta < 0 && angle > Math.PI) ||
        (delta > 0 && angle < Math.PI) ||
        (delta > 0 && Math.abs(angle-Math.PI*2) < .2)
      )
    {
      return [];
    }

    var steps = Math.floor(angle/rads);

    for (var i = 1; i<=steps; i++) {
      var actual = angleToNextNormal - (i*rads);
      var nextCorner = normal.clone().rotate(actual);
      if (delta < 0) {
        nextCorner.negate()
      }
      corner.push(nextCorner.add(current));
    }

    return corner;
  };


  orig.each(function(prev, current, next, idx) {

    var pdiff = current.subtract(prev, true);
    var ndiff = next.subtract(current, true);

    var normal = Vec2(delta, 0);
    var pangle = normal.angleTo(pdiff);
    var nangle = normal.angleTo(ndiff);

    var pnormal = normal.clone().rotate(pangle).skew();
    var nnormal = normal.clone().rotate(nangle).skew();

    if (delta < 0) {
      pnormal.negate();
      nnormal.negate();
    }

    var a = pnormal.add(prev, true);
    var b = pnormal.add(current, true);
    var c = nnormal.add(current, true);

    ret.push(a);
    ret.push(b);

    var cornerAngle = current.subtract(prev, true).angleTo(next.subtract(current, true));

    if (cornerAngle <= 0 || normal.angleTo(current.subtract(current, true)) === 0) {
      ret = ret.concat(cornerFn.call(orig, current, b, c, normal, delta) || []);
    }
  });


  var f = [], poly = Polygon(ret), seen = {};
  poly.each(function(prev, current) {
    f.push(prev);
    poly.each(function(ip, ic) {
      var i = segseg(prev, current, ip, ic);

      if (i && i!==true) {
        i = Vec2.fromArray(i);
        if (ip.equal(i) || ic.equal(i)) {
          return;
        }

        var key = i.x + ':'+ i.y;
        if (!seen[key]) {
          f.push(i);
          seen[key] = true;

          // Exit early when we've found a new intersection
          return false;
        }
      }
    });

    f.push(current);
  });

  return Polygon(f.filter(function(current) {

    var contained = orig.containsPoint(current);
    if ((delta > 0 && contained) || (delta < 0 && !contained)) {
      return false;
    }

    var closest = orig.closestPointTo(current);

    if (Math.abs(closest.distance(current) - Math.abs(delta)) > 0.00001) {
      return false;
    }
    return true;
  })).clean().points;
};
