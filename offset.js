var Polygon = require('polygon');
var Vec2 = require('vec2');
var segseg = require('segseg');

module.exports = function(poly, delta, cornerFn) {
  var ret = [], orig = Polygon(poly);

  // clean the polygon
  orig.rewind(true).each(function(prev, current, next) {

    var diff = current.subtract(prev, true);

    var normal = Vec2(delta, 0);
    var angle = normal.angleTo(diff);
    normal = normal.rotate(angle).skew();

    if (delta < 0) { normal.negate(); }

    ret.push(normal.add(prev, true));
    ret.push(normal.add(current, true));
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

  return f.filter(function(current) {

    var contained = orig.containsPoint(current);
    if ((delta > 0 && contained) || (delta < 0 && !contained)) {
      return false;
    }

    var closest = orig.closestPointTo(current);

    if (Math.abs(closest.distance(current) - Math.abs(delta)) > 0.01) {
      return false;
    }
    return true;
  });
};
