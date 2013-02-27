var Polygon = require('polygon');
var Vec2 = require('vec2');
var segseg = require('segseg');
var PI2 = Math.PI*2;

module.exports = function(poly, delta, cornerFn) {

  var ret = [],
      last = null,
      orig = Polygon(poly.filter(function(a) {
        var ret = false;
        if (!last || !last.equal(a)) {
          ret = true;;
        }

        last = a;
        return ret;
      }));



  // clean the polygon
  orig.rewind(true).each(function(prev, current, next, idx) {



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

    var center = c.add(b, true).divide(2);

    if (cornerAngle <= 0 || normal.angleTo(current.subtract(current, true)) === 0) {
      var angle = normal.angleTo(current.subtract(current, true));
      var corner = normal.clone().rotate(normal.angleTo(current.subtract(center, true))).negate();
      ret.push(corner.add(current));
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

  return f.filter(function(current) {

    var contained = orig.containsPoint(current);
    if ((delta > 0 && contained) || (delta < 0 && !contained)) {
      return false;
    }

    var closest = orig.closestPointTo(current);

    if (Math.abs(closest.distance(current) - Math.abs(delta)) > 0.00001) {
      return false;
    }
    return true;
  });
};
