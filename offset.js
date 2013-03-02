var Polygon = require('polygon');
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
      orig = Polygon(poly).clean().rewind(true);

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

    var b = pnormal.add(current, true);
    var c = nnormal.add(current, true);

    ret.push(pnormal.add(prev, true));
    ret.push(b);

    var cornerAngle = toTAU(current.subtract(prev, true).angleTo(next.subtract(current, true)));

    if ((delta < 0 && cornerAngle - TAU/2 < 0) ||
        (delta > 0 && cornerAngle - TAU/2 > 0))
    {
      ret = ret.concat(cornerFn.call(orig, current, b, c, delta, cornerAngle) || []);
    }
  });

  var f = [], poly = Polygon(ret), seen = {};
  poly.each(function(prev, current) {
    //f.push(prev);
    poly.each(function(ip, ic) {
      var i = segseg(prev, current, ip, ic);

      if (i && i!==true) {
        i = Vec2.fromArray(i);
        if (ip.equal(i) || ic.equal(i)) {
          return;
        }

        var key = i.x + ':'+ i.y;
        if (!seen[key]) {
          i.intersection = true;
          f.push(i);
          seen[key] = true;

          // Exit early when we've found a new intersection
          return false;
        }
      }
    });

    f.push(current);
  });

  f = f.filter(function(current) {

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

  function Node(vec) {
    this.vec = vec;
    this.children = [];
  }

  Node.prototype = {
    vec : null,
    children: null
  };

  // final polygon detection
  var polys = [], poly = [], last = null;

  var sorted = f.concat();
  sorted.sort(function(a, b) {
    return (a.y < b.y) ? -1 : 1;
  }).forEach(function(item) {
    var s = Vec2(-1000, item.y), e = Vec2(1000, item.y);
    var count = 0;
    Polygon(f).each(function(p, c) {
      var i = segseg(s, e, p, c);
      if (i && i!==true) {
        count++;
      }
    });

    item.beamCount = count;

    console.log('SCANBEAM @', item.y, '#', count, !!item.intersection);
  });

  last = f[0].beamCount;
  Polygon(f).each(function(p, c, n) {
    console.log('ITEM', c.beamCount, c.intersection);
    if (c.beamCount%2 === 1 && !c.intersection && poly.length > 0) {
      poly.push(c);
      poly.length && polys.push(poly);
      poly = [];
    } else {
      poly.push(c);
    }
    last = c.beamCount;
  });

  polys.push(poly);
  polys.forEach(function(p) {
    console.log(p.length);
  })
console.log(polys.length)
  return polys;
};
