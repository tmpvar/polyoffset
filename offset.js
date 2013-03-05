var Polygon = require('polygon.clip');
var Vec2 = require('vec2');
var segseg = require('segseg');
var TAU = Math.PI*2;
var toTAU = function(rads) {
  if (rads<0) {
    rads += TAU;
  }

  return rads;
};

module.exports = function(poly, delta, cornerFn) {

  var ret = [],
      last = null,
      orig = Polygon(poly).clean().rewind(true),
      skip = false;

  // Default to arcs for corners
  cornerFn = cornerFn || function(current, currentNormal, nextNormal, delta, cornerAngle) {
    var rads = .1;
    var normal = Vec2(delta, 0);
    var corner = [];
    var angleToCurrentNormal = toTAU(normal.angleTo(currentNormal.subtract(current, true)));
    var steps = (TAU-cornerAngle)/rads;

    if (delta < 0) {
      cornerAngle = TAU - cornerAngle;
      steps = (TAU-cornerAngle)/rads;
      rads = -rads;
    }

    normal.rotate(angleToCurrentNormal);

    for (var i=0; i<steps; i++) {
      corner.push(normal.rotate(-rads).add(current, true));
    }
    return corner;
  };

  orig.each(function(prev, current, next, idx) {
    var normal = Vec2(delta, 0);
    var pdiff = current.subtract(prev, true);
    var ndiff = next.subtract(current, true);
    var pnormal = normal.clone().rotate(normal.angleTo(pdiff)).skew();
    var nnormal = normal.clone().rotate(normal.angleTo(ndiff)).skew();

    if (delta < 0) {
      pnormal.negate();
      nnormal.negate();
    }

    var a = pnormal.add(prev, true)
    var b = pnormal.add(current, true);
    var c = nnormal.add(current, true);
    var d = nnormal.add(next, true);

    var cornerAngle = toTAU(current.subtract(prev, true).angleTo(next.subtract(current, true)));

    if ((delta < 0 && cornerAngle - TAU/2 < 0) ||
        (delta > 0 && cornerAngle - TAU/2 > 0))
    {
      !skip && ret.push(b);
      ret = ret.concat(cornerFn.call(orig, current, b, c, delta, cornerAngle) || []);
      skip = false;
    } else {
      var i = segseg(a, b, c, d);
      if (i && i!==true) {
        console.log(i, Vec2.fromArray(i).distance(c));
        ret.push(Vec2.fromArray(i));
        skip = true;
      }
    }
  });

  var subjectPoly = Polygon(ret),
      clipPoly = subjectPoly.clone(),
      subjectList = subjectPoly.createLinkedList(),
      clipList = clipPoly.createLinkedList(),
      results = [],
      result;

  var ensureDistance = function(array) {

    return array.filter(function(current) {
      if (!current) {
        return false;
      }

      var contained = orig.containsPoint(current);
      if ((delta > 0 && contained) || (delta < 0 && !contained)) {
        return false;
      }

      var closest = orig.closestPointTo(current);
      console.log('CLOSEST', closest.toArray(), current.toArray(), closest.distance(current));
      if (Math.abs(closest.distance(current) - Math.abs(delta)) > 0.00001) {
        return false;
      }
      return true;
    });
  };


  var polys = subjectPoly.clip(clipPoly, 'self');

  if (!polys.length) {
    return [ensureDistance(subjectPoly.points)];
  }

  polys.forEach(function(poly) {
    results.push(poly.points);
    // var points = ensureDistance(poly.points);
    // points && points.length && results.push(points);
  });

  return results;
};
